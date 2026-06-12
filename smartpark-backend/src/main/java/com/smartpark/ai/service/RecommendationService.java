package com.smartpark.ai.service;

import com.smartpark.ai.dto.ParkingSlotDTO;
import com.smartpark.ai.entity.ParkingSlot;
import com.smartpark.ai.entity.ParkingZone;
import com.smartpark.ai.repository.ParkingSlotRepository;
import com.smartpark.ai.repository.ParkingZoneRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RecommendationService {

    private final ParkingZoneRepository parkingZoneRepository;
    private final ParkingSlotRepository parkingSlotRepository;
    private final ParkingSlotService parkingSlotService;

    public List<ParkingSlotDTO> recommendSlots(Long parkingLotId, String preferredZoneType) {
        List<ParkingZone> zones = parkingZoneRepository.findByParkingLotId(parkingLotId);
        
        List<SlotScore> scoredSlots = new ArrayList<>();

        for (ParkingZone zone : zones) {
            // Filter by preferred zone type if specified
            if (preferredZoneType != null && !preferredZoneType.equalsIgnoreCase(zone.getZoneType().name())) {
                continue;
            }

            List<ParkingSlot> allSlotsInZone = parkingSlotRepository.findByParkingZoneId(zone.getId());
            List<ParkingSlot> availableSlots = allSlotsInZone.stream()
                    .filter(s -> s.getStatus() == ParkingSlot.SlotStatus.AVAILABLE)
                    .toList();

            if (allSlotsInZone.isEmpty()) continue;

            // Calculate zone occupancy rate
            double occupiedCount = allSlotsInZone.size() - availableSlots.size();
            double occupancyRate = occupiedCount / allSlotsInZone.size();

            // Score calculation: Score = (price * 0.4) + (distance * 0.4) + (occupancyRate * 0.2)
            // Lower score represents better suitability
            double priceFactor = zone.getPricePerHour().doubleValue();
            double distanceFactor = zone.getDistanceFromEntrance();
            double score = (priceFactor * 0.4) + (distanceFactor * 0.4) + (occupancyRate * 0.2);

            for (ParkingSlot slot : availableSlots) {
                scoredSlots.add(new SlotScore(slot, score));
            }
        }

        // Sort by score ascending (lowest score first)
        scoredSlots.sort(Comparator.comparingDouble(SlotScore::score));

        // Return top 5 slots
        return scoredSlots.stream()
                .limit(5)
                .map(ss -> parkingSlotService.mapToDTO(ss.slot()))
                .collect(Collectors.toList());
    }

    private record SlotScore(ParkingSlot slot, double score) {}
}
