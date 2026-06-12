package com.smartpark.ai.service;

import com.smartpark.ai.dto.BookingRequestDTO;
import com.smartpark.ai.dto.BookingResponseDTO;
import com.smartpark.ai.entity.*;
import com.smartpark.ai.exception.InvalidBookingException;
import com.smartpark.ai.exception.ResourceNotFoundException;
import com.smartpark.ai.repository.*;
import com.smartpark.ai.ds.ParkingQueueManager;
import com.smartpark.ai.ds.DateSortedBookingHistory;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.TreeMap;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final VehicleRepository vehicleRepository;
    private final ParkingLotRepository parkingLotRepository;
    private final ParkingSlotRepository parkingSlotRepository;
    private final ParkingZoneRepository parkingZoneRepository;
    private final ParkingQueueManager queueManager;
    private final NotificationService notificationService;
    private final QrPassService qrPassService;
    private final AuditLogService auditLogService;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public BookingResponseDTO createBooking(BookingRequestDTO request, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with id: " + request.getVehicleId()));

        if (!vehicle.getUser().getId().equals(userId)) {
            throw new InvalidBookingException("Vehicle does not belong to the current user");
        }

        ParkingLot lot = parkingLotRepository.findById(request.getParkingLotId())
                .orElseThrow(() -> new ResourceNotFoundException("Parking lot not found with id: " + request.getParkingLotId()));

        // Generate unique booking reference
        String bookingReference = "SP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        Booking booking = Booking.builder()
                .bookingReference(bookingReference)
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .user(user)
                .vehicle(vehicle)
                .build();

        // Check availability across all lot zones
        if (lot.getAvailableSlots() > 0) {
            List<ParkingZone> zones = parkingZoneRepository.findByParkingLotId(lot.getId());
            List<ParkingSlot> availableSlots = new ArrayList<>();
            for (ParkingZone zone : zones) {
                availableSlots.addAll(parkingSlotRepository.findByParkingZoneIdAndStatus(zone.getId(), ParkingSlot.SlotStatus.AVAILABLE));
            }

            if (!availableSlots.isEmpty()) {
                ParkingSlot slot = availableSlots.get(0);
                
                // Book slot
                slot.setStatus(ParkingSlot.SlotStatus.RESERVED);
                parkingSlotRepository.save(slot);
                queueManager.updateSlotStatus(slot.getId(), ParkingSlot.SlotStatus.RESERVED);

                // Update lot availability
                lot.setAvailableSlots(lot.getAvailableSlots() - 1);
                parkingLotRepository.save(lot);

                booking.setSlot(slot);
                booking.setStatus(Booking.BookingStatus.PENDING); // Awaiting payment
                
                Booking savedBooking = bookingRepository.save(booking);

                // Generate QR Pass for booking
                qrPassService.generatePass(savedBooking);

                // Log Audit
                auditLogService.logAction("CREATE_BOOKING", "Booking", savedBooking.getId(), user.getEmail());

                // Notify User
                notificationService.sendNotification(user, 
                        "Booking Reserved", 
                        "Your slot " + slot.getSlotNumber() + " is reserved. Ref: " + bookingReference + ". Please make payment.", 
                        Notification.NotificationType.SUCCESS);

                // Send Real-time notification
                messagingTemplate.convertAndSend("/topic/notifications", "Booking reserved reference " + bookingReference);

                return mapToDTO(savedBooking);
            }
        }

        // If no slot available, user joins the waiting list
        booking.setStatus(Booking.BookingStatus.WAITING);
        Booking savedBooking = bookingRepository.save(booking);

        // Put in queue
        queueManager.enqueueRequest(lot.getId(), savedBooking);

        // Log Audit
        auditLogService.logAction("JOIN_WAITLIST", "Booking", savedBooking.getId(), user.getEmail());

        // Notify User
        notificationService.sendNotification(user, 
                "Added to Waiting List", 
                "Parking is full. You have been placed on the waiting list. Ref: " + bookingReference, 
                Notification.NotificationType.WARNING);

        // Send Real-time notification
        messagingTemplate.convertAndSend("/topic/notifications", "User added to parking waiting list");

        return mapToDTO(savedBooking);
    }

    @Transactional
    public BookingResponseDTO cancelBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + bookingId));

        if (booking.getStatus() == Booking.BookingStatus.CANCELLED || booking.getStatus() == Booking.BookingStatus.COMPLETED) {
            throw new InvalidBookingException("Booking is already " + booking.getStatus());
        }

        ParkingSlot slot = booking.getSlot();
        booking.setStatus(Booking.BookingStatus.CANCELLED);
        Booking savedBooking = bookingRepository.save(booking);

        // Log Audit
        auditLogService.logAction("CANCEL_BOOKING", "Booking", booking.getId(), booking.getUser().getEmail());

        if (slot != null) {
            ParkingLot lot = slot.getParkingZone().getParkingLot();
            
            // Check if anyone is waiting
            if (queueManager.hasWaitingRequests(lot.getId())) {
                Booking waitingBooking = queueManager.dequeueNextRequest(lot.getId());
                if (waitingBooking != null) {
                    // Re-verify that booking is still waiting
                    Optional<Booking> freshWaitingBooking = bookingRepository.findById(waitingBooking.getId());
                    if (freshWaitingBooking.isPresent() && freshWaitingBooking.get().getStatus() == Booking.BookingStatus.WAITING) {
                        Booking nextBooking = freshWaitingBooking.get();
                        nextBooking.setSlot(slot);
                        nextBooking.setStatus(Booking.BookingStatus.PENDING); // Now awaiting payment
                        bookingRepository.save(nextBooking);

                        // Generate QR Pass for next user
                        qrPassService.generatePass(nextBooking);

                        // Log Audit
                        auditLogService.logAction("ALLOCATE_WAITLIST_SLOT", "Booking", nextBooking.getId());

                        // Note: slot status remains RESERVED since it is allocated to next user immediately.
                        notificationService.sendNotification(nextBooking.getUser(), 
                                "Slot Available", 
                                "A parking slot has opened! Slot: " + slot.getSlotNumber() + ". Ref: " + nextBooking.getBookingReference() + ". Please complete payment.", 
                                Notification.NotificationType.SUCCESS);
                        
                        messagingTemplate.convertAndSend("/topic/notifications", "Waitlist user advanced for slot " + slot.getSlotNumber());

                        return mapToDTO(savedBooking);
                    }
                }
            }

            // No one waiting, free the slot
            slot.setStatus(ParkingSlot.SlotStatus.AVAILABLE);
            parkingSlotRepository.save(slot);
            queueManager.updateSlotStatus(slot.getId(), ParkingSlot.SlotStatus.AVAILABLE);

            // Increment lot available slots count
            lot.setAvailableSlots(lot.getAvailableSlots() + 1);
            parkingLotRepository.save(lot);

            messagingTemplate.convertAndSend("/topic/notifications", "Slot " + slot.getSlotNumber() + " has become available");

        } else {
            // Cancelled from waiting list, remove from queue manager
            for (ParkingLot lot : parkingLotRepository.findAll()) {
                queueManager.removeRequest(lot.getId(), booking);
            }
        }

        notificationService.sendNotification(booking.getUser(), 
                "Booking Cancelled", 
                "Your booking reference " + booking.getBookingReference() + " has been cancelled.", 
                Notification.NotificationType.INFO);

        messagingTemplate.convertAndSend("/topic/notifications", "Booking cancelled reference " + booking.getBookingReference());

        return mapToDTO(savedBooking);
    }

    public List<BookingResponseDTO> getBookingHistory(Long userId) {
        List<Booking> bookings = bookingRepository.findByUserId(userId);
        
        // Sorting history using TreeMap (Newest first)
        TreeMap<LocalDateTime, List<Booking>> sortedHistory = DateSortedBookingHistory.getSortedHistory(bookings);
        List<Booking> sortedList = DateSortedBookingHistory.flatten(sortedHistory);

        return sortedList.stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public List<BookingResponseDTO> getAllBookings() {
        List<Booking> bookings = bookingRepository.findAll();
        TreeMap<LocalDateTime, List<Booking>> sortedHistory = DateSortedBookingHistory.getSortedHistory(bookings);
        List<Booking> sortedList = DateSortedBookingHistory.flatten(sortedHistory);
        
        return sortedList.stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public BookingResponseDTO getBookingById(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + id));
        return mapToDTO(booking);
    }

    @Transactional
    public void deleteBooking(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + id));
        
        // Free resources if deleting active booking
        if (booking.getStatus() == Booking.BookingStatus.ACTIVE || booking.getStatus() == Booking.BookingStatus.PENDING) {
            ParkingSlot slot = booking.getSlot();
            if (slot != null) {
                slot.setStatus(ParkingSlot.SlotStatus.AVAILABLE);
                parkingSlotRepository.save(slot);
                queueManager.updateSlotStatus(slot.getId(), ParkingSlot.SlotStatus.AVAILABLE);

                ParkingLot lot = slot.getParkingZone().getParkingLot();
                lot.setAvailableSlots(lot.getAvailableSlots() + 1);
                parkingLotRepository.save(lot);
            }
        }
        bookingRepository.delete(booking);
    }

    public BookingResponseDTO mapToDTO(Booking booking) {
        BookingResponseDTO.BookingResponseDTOBuilder builder = BookingResponseDTO.builder()
                .id(booking.getId())
                .bookingReference(booking.getBookingReference())
                .bookingDate(booking.getBookingDate())
                .startTime(booking.getStartTime())
                .endTime(booking.getEndTime())
                .status(booking.getStatus().name())
                .userId(booking.getUser().getId())
                .userEmail(booking.getUser().getEmail())
                .vehicleId(booking.getVehicle().getId())
                .vehicleNumber(booking.getVehicle().getVehicleNumber());

        if (booking.getSlot() != null) {
            builder.slotId(booking.getSlot().getId())
                   .slotNumber(booking.getSlot().getSlotNumber())
                   .parkingLotId(booking.getSlot().getParkingZone().getParkingLot().getId())
                   .parkingLotName(booking.getSlot().getParkingZone().getParkingLot().getName());
        }

        return builder.build();
    }
}
