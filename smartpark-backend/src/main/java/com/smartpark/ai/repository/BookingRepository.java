package com.smartpark.ai.repository;

import com.smartpark.ai.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.EntityGraph;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    @EntityGraph(attributePaths = {"user", "vehicle", "slot", "slot.parkingZone", "slot.parkingZone.parkingLot"})
    List<Booking> findByUserId(Long userId);

    @EntityGraph(attributePaths = {"user", "vehicle", "slot", "slot.parkingZone", "slot.parkingZone.parkingLot"})
    List<Booking> findAll();

    Optional<Booking> findByBookingReference(String bookingReference);

    List<Booking> findByBookingDateAfter(LocalDateTime cutoffDate);
}
