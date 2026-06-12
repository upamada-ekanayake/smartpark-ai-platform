package com.smartpark.ai.service;

import com.smartpark.ai.dto.PaymentDTO;
import com.smartpark.ai.entity.*;
import com.smartpark.ai.exception.InvalidBookingException;
import com.smartpark.ai.exception.ResourceNotFoundException;
import com.smartpark.ai.repository.BookingRepository;
import com.smartpark.ai.repository.PaymentRepository;
import com.smartpark.ai.repository.ParkingSlotRepository;
import com.smartpark.ai.ds.ParkingQueueManager;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;
    private final ParkingSlotRepository parkingSlotRepository;
    private final ParkingQueueManager queueManager;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public PaymentDTO processPayment(PaymentDTO dto) {
        Booking booking = bookingRepository.findById(dto.getBookingId())
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + dto.getBookingId()));

        if (booking.getStatus() == Booking.BookingStatus.ACTIVE) {
            throw new InvalidBookingException("Booking is already paid and active");
        }
        if (booking.getStatus() == Booking.BookingStatus.CANCELLED || booking.getStatus() == Booking.BookingStatus.COMPLETED) {
            throw new InvalidBookingException("Cannot pay for a " + booking.getStatus() + " booking");
        }

        // Generate transaction reference
        String transactionReference = "TXN-" + UUID.randomUUID().toString().substring(0, 12).toUpperCase();

        Payment payment = Payment.builder()
                .amount(dto.getAmount())
                .paymentMethod(Payment.PaymentMethod.valueOf(dto.getPaymentMethod().toUpperCase()))
                .paymentStatus(Payment.PaymentStatus.COMPLETED) // Assume payment is successful immediately
                .transactionReference(transactionReference)
                .booking(booking)
                .build();

        Payment savedPayment = paymentRepository.save(payment);

        // Update booking and slot status
        booking.setStatus(Booking.BookingStatus.ACTIVE);
        
        ParkingSlot slot = booking.getSlot();
        if (slot != null) {
            slot.setStatus(ParkingSlot.SlotStatus.OCCUPIED);
            parkingSlotRepository.save(slot);
            queueManager.updateSlotStatus(slot.getId(), ParkingSlot.SlotStatus.OCCUPIED);
        }

        bookingRepository.save(booking);

        // Log Audit
        auditLogService.logAction("PROCESS_PAYMENT", "Payment", savedPayment.getId(), booking.getUser().getEmail());

        // Notify User
        notificationService.sendNotification(booking.getUser(),
                "Payment Successful",
                "Payment of $" + dto.getAmount() + " processed successfully. Ref: " + transactionReference + ". Your booking is active.",
                Notification.NotificationType.SUCCESS);

        // Send WebSocket notification
        messagingTemplate.convertAndSend("/topic/notifications", "Payment success for booking reference " + booking.getBookingReference());

        return mapToDTO(savedPayment);
    }

    public List<PaymentDTO> getAllPayments() {
        return paymentRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public PaymentDTO getPaymentById(Long id) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with id: " + id));
        return mapToDTO(payment);
    }

    public PaymentDTO getPaymentByBookingId(Long bookingId) {
        Payment payment = paymentRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found for booking id: " + bookingId));
        return mapToDTO(payment);
    }

    public PaymentDTO mapToDTO(Payment payment) {
        return PaymentDTO.builder()
                .id(payment.getId())
                .amount(payment.getAmount())
                .paymentMethod(payment.getPaymentMethod().name())
                .paymentStatus(payment.getPaymentStatus().name())
                .transactionReference(payment.getTransactionReference())
                .bookingId(payment.getBooking().getId())
                .build();
    }
}
