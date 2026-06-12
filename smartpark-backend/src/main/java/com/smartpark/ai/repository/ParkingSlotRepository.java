package com.smartpark.ai.repository;

import com.smartpark.ai.entity.ParkingSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ParkingSlotRepository extends JpaRepository<ParkingSlot, Long> {
    List<ParkingSlot> findByParkingZoneId(Long parkingZoneId);
    List<ParkingSlot> findByParkingZoneIdAndStatus(Long parkingZoneId, ParkingSlot.SlotStatus status);
    List<ParkingSlot> findByParkingZoneParkingLotId(Long lotId);
}
