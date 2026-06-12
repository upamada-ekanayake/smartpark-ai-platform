package com.smartpark.ai.service;

import com.smartpark.ai.entity.*;
import com.smartpark.ai.exception.InvalidBookingException;
import com.smartpark.ai.exception.ResourceNotFoundException;
import com.smartpark.ai.repository.*;
import com.smartpark.ai.ds.ParkingQueueManager;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class QrPassService {

    private final QrPassRepository qrPassRepository;
    private final EntryLogRepository entryLogRepository;
    private final BookingRepository bookingRepository;
    private final ParkingSlotRepository parkingSlotRepository;
    private final ParkingLotRepository parkingLotRepository;
    private final ParkingQueueManager queueManager;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public QrPass generatePass(Booking booking) {
        String token = "QRP-" + booking.getBookingReference() + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        
        QrPass pass = QrPass.builder()
                .passToken(token)
                .isActive(true)
                .booking(booking)
                .build();
                
        QrPass savedPass = qrPassRepository.save(pass);
        auditLogService.logAction("GENERATE_QR_PASS", "QrPass", savedPass.getId());
        return savedPass;
    }

    public QrPass getPassByBookingId(Long bookingId) {
        return qrPassRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("QR Pass not found for booking id: " + bookingId));
    }

    @Transactional
    public String scanPass(String token) {
        QrPass pass = qrPassRepository.findByPassToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Invalid QR Pass Token"));

        if (!pass.getIsActive()) {
            throw new InvalidBookingException("QR Pass is inactive/expired");
        }

        Booking booking = pass.getBooking();
        if (booking.getStatus() == Booking.BookingStatus.CANCELLED || booking.getStatus() == Booking.BookingStatus.COMPLETED) {
            throw new InvalidBookingException("Booking associated with this pass is " + booking.getStatus());
        }

        if (booking.getStatus() == Booking.BookingStatus.PENDING) {
            throw new InvalidBookingException("Payment required before parking entry");
        }

        ParkingSlot slot = booking.getSlot();
        if (slot == null) {
            throw new InvalidBookingException("No slot assigned to this reservation");
        }

        // Check for active entry log (in-facility)
        List<EntryLog> logs = entryLogRepository.findByQrPassId(pass.getId());
        Optional<EntryLog> activeLog = logs.stream()
                .filter(l -> l.getExitTime() == null)
                .findFirst();

        if (activeLog.isEmpty()) {
            // ENTRANCE PROCESS
            EntryLog entryLog = EntryLog.builder()
                    .entryTime(LocalDateTime.now())
                    .qrPass(pass)
                    .build();
            entryLogRepository.save(entryLog);
            
            // Mark slot status as OCCUPIED
            slot.setStatus(ParkingSlot.SlotStatus.OCCUPIED);
            parkingSlotRepository.save(slot);
            queueManager.updateSlotStatus(slot.getId(), ParkingSlot.SlotStatus.OCCUPIED);

            auditLogService.logAction("SCAN_QR_ENTRY", "QrPass", pass.getId(), booking.getUser().getEmail());
            notificationService.sendNotification(booking.getUser(),
                    "Welcome to SmartPark",
                    "Your vehicle entered slot " + slot.getSlotNumber() + " at " + LocalDateTime.now().toString().substring(11, 16),
                    Notification.NotificationType.INFO);

            // Notify via WebSocket
            messagingTemplate.convertAndSend("/topic/notifications", "User entered slot " + slot.getSlotNumber());

            return "ENTRANCE_SUCCESS:" + slot.getSlotNumber() + ":" + slot.getParkingZone().getParkingLot().getName();
        } else {
            // EXIT PROCESS
            EntryLog entryLog = activeLog.get();
            entryLog.setExitTime(LocalDateTime.now());
            entryLogRepository.save(entryLog);

            // Deactivate Pass & Complete Booking
            pass.setIsActive(false);
            qrPassRepository.save(pass);

            booking.setStatus(Booking.BookingStatus.COMPLETED);
            bookingRepository.save(booking);

            ParkingLot lot = slot.getParkingZone().getParkingLot();

            // Process next waitlist request if available
            if (queueManager.hasWaitingRequests(lot.getId())) {
                Booking waitingBooking = queueManager.dequeueNextRequest(lot.getId());
                if (waitingBooking != null) {
                    Optional<Booking> freshWaiting = bookingRepository.findById(waitingBooking.getId());
                    if (freshWaiting.isPresent() && freshWaiting.get().getStatus() == Booking.BookingStatus.WAITING) {
                        Booking nextBooking = freshWaiting.get();
                        
                        // Assign this slot immediately to the next waiting user
                        nextBooking.setSlot(slot);
                        nextBooking.setStatus(Booking.BookingStatus.PENDING); // Awaiting payment
                        bookingRepository.save(nextBooking);
                        
                        // Generate QR Pass for the next user
                        generatePass(nextBooking);

                        // Keep slot as RESERVED for the new user
                        slot.setStatus(ParkingSlot.SlotStatus.RESERVED);
                        parkingSlotRepository.save(slot);
                        queueManager.updateSlotStatus(slot.getId(), ParkingSlot.SlotStatus.RESERVED);

                        auditLogService.logAction("ALLOCATE_WAITLIST_SLOT", "Booking", nextBooking.getId());
                        
                        notificationService.sendNotification(nextBooking.getUser(),
                                "Slot Assigned from Waitlist",
                                "A parking slot has opened! Slot: " + slot.getSlotNumber() + ". Ref: " + nextBooking.getBookingReference() + ". Please complete payment.",
                                Notification.NotificationType.SUCCESS);

                        // WebSocket push
                        messagingTemplate.convertAndSend("/topic/notifications", "Waitlist user advanced to booking");
                        
                        return "EXIT_SUCCESS:" + slot.getSlotNumber() + ":" + lot.getName();
                    }
                }
            }

            // No one waiting, free the slot completely
            slot.setStatus(ParkingSlot.SlotStatus.AVAILABLE);
            parkingSlotRepository.save(slot);
            queueManager.updateSlotStatus(slot.getId(), ParkingSlot.SlotStatus.AVAILABLE);

            // Increment lot available count
            lot.setAvailableSlots(Math.min(lot.getTotalSlots(), lot.getAvailableSlots() + 1));
            parkingLotRepository.save(lot);

            auditLogService.logAction("SCAN_QR_EXIT", "QrPass", pass.getId(), booking.getUser().getEmail());
            notificationService.sendNotification(booking.getUser(),
                    "Thank you for visiting",
                    "Your vehicle exited slot " + slot.getSlotNumber() + " at " + LocalDateTime.now().toString().substring(11, 16),
                    Notification.NotificationType.INFO);

            // WebSocket push
            messagingTemplate.convertAndSend("/topic/notifications", "Slot " + slot.getSlotNumber() + " has become available");

            return "EXIT_SUCCESS:" + slot.getSlotNumber() + ":" + lot.getName();
        }
    }
}
