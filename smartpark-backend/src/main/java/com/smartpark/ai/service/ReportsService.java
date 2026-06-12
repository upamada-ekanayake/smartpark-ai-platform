package com.smartpark.ai.service;

import com.smartpark.ai.dto.ReportsDTO;
import com.smartpark.ai.entity.Booking;
import com.smartpark.ai.entity.Payment;
import com.smartpark.ai.entity.ParkingSlot;
import com.smartpark.ai.repository.BookingRepository;
import com.smartpark.ai.repository.PaymentRepository;
import com.smartpark.ai.repository.ParkingSlotRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportsService {

    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final ParkingSlotRepository parkingSlotRepository;

    public ReportsDTO generateReport(String period) {
        LocalDateTime cutoffDate = getCutoffDate(period);

        // Fetch bookings within period directly from database
        List<Booking> filteredBookings = bookingRepository.findByBookingDateAfter(cutoffDate);

        long totalBookings = filteredBookings.size();
        long completed = filteredBookings.stream().filter(b -> b.getStatus() == Booking.BookingStatus.COMPLETED).count();
        long cancelled = filteredBookings.stream().filter(b -> b.getStatus() == Booking.BookingStatus.CANCELLED).count();

        // Fetch payments only for the filtered bookings using in-queries
        List<Long> filteredBookingIds = filteredBookings.stream().map(Booking::getId).toList();
        List<Payment> filteredPayments = filteredBookingIds.isEmpty() ? List.of() :
                paymentRepository.findByBookingIdInAndPaymentStatus(filteredBookingIds, Payment.PaymentStatus.COMPLETED);

        BigDecimal totalRevenue = filteredPayments.stream()
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Payment methods count
        Map<String, Long> methodCounts = filteredPayments.stream()
                .collect(Collectors.groupingBy(p -> p.getPaymentMethod().name(), Collectors.counting()));

        // Current Slot Occupancy
        List<ParkingSlot> slots = parkingSlotRepository.findAll();
        double occupancyRate = 0.0;
        if (!slots.isEmpty()) {
            long occupied = slots.stream()
                    .filter(s -> s.getStatus() == ParkingSlot.SlotStatus.OCCUPIED || s.getStatus() == ParkingSlot.SlotStatus.RESERVED)
                    .count();
            occupancyRate = ((double) occupied / slots.size()) * 100;
        }

        return ReportsDTO.builder()
                .period(period.toUpperCase())
                .totalRevenue(totalRevenue)
                .totalBookings(totalBookings)
                .completedBookings(completed)
                .cancelledBookings(cancelled)
                .averageOccupancyRate(occupancyRate)
                .paymentsMethodCount(methodCounts)
                .build();
    }

    private LocalDateTime getCutoffDate(String period) {
        LocalDateTime now = LocalDateTime.now();
        return switch (period.toLowerCase()) {
            case "daily" -> now.withHour(0).withMinute(0).withSecond(0).withNano(0);
            case "weekly" -> now.minusWeeks(1);
            case "monthly" -> now.minusMonths(1);
            default -> now.minusYears(10); // fallback all time
        };
    }
}
