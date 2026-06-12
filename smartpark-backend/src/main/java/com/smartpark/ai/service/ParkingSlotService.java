package com.smartpark.ai.service;

import com.smartpark.ai.dto.ParkingSlotDTO;
import com.smartpark.ai.entity.ParkingLot;
import com.smartpark.ai.entity.ParkingZone;
import com.smartpark.ai.entity.ParkingSlot;
import com.smartpark.ai.exception.ResourceNotFoundException;
import com.smartpark.ai.repository.ParkingLotRepository;
import com.smartpark.ai.repository.ParkingZoneRepository;
import com.smartpark.ai.repository.ParkingSlotRepository;
import com.smartpark.ai.ds.ParkingQueueManager;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ParkingSlotService {

    private final ParkingSlotRepository parkingSlotRepository;
    private final ParkingZoneRepository parkingZoneRepository;
    private final ParkingLotRepository parkingLotRepository;
    private final ParkingQueueManager queueManager;
    private final AuditLogService auditLogService;

    @PostConstruct
    public void initSlotCache() {
        List<ParkingSlot> slots = parkingSlotRepository.findAll();
        for (ParkingSlot slot : slots) {
            queueManager.registerSlot(slot.getId(), slot.getStatus());
        }
    }

    @Transactional
    public ParkingSlotDTO createSlot(ParkingSlotDTO dto) {
        ParkingZone zone = parkingZoneRepository.findById(dto.getParkingZoneId())
                .orElseThrow(() -> new ResourceNotFoundException("Parking zone not found with id: " + dto.getParkingZoneId()));

        ParkingSlot slot = ParkingSlot.builder()
                .slotNumber(dto.getSlotNumber())
                .slotType(ParkingSlot.SlotType.valueOf(dto.getSlotType().toUpperCase()))
                .status(ParkingSlot.SlotStatus.AVAILABLE)
                .parkingZone(zone)
                .build();

        ParkingSlot savedSlot = parkingSlotRepository.save(slot);
        queueManager.registerSlot(savedSlot.getId(), savedSlot.getStatus());
        
        // Adjust parent lot counters
        ParkingLot lot = zone.getParkingLot();
        lot.setTotalSlots(lot.getTotalSlots() + 1);
        lot.setAvailableSlots(lot.getAvailableSlots() + 1);
        parkingLotRepository.save(lot);

        auditLogService.logAction("CREATE_SLOT", "ParkingSlot", savedSlot.getId());

        return mapToDTO(savedSlot);
    }

    public List<ParkingSlotDTO> getSlotsByZoneId(Long zoneId) {
        return parkingSlotRepository.findByParkingZoneId(zoneId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public List<ParkingSlotDTO> getSlotsByLotId(Long lotId) {
        return parkingSlotRepository.findByParkingZoneParkingLotId(lotId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public List<ParkingSlotDTO> getAllSlots() {
        return parkingSlotRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public ParkingSlotDTO getSlotById(Long id) {
        ParkingSlot.SlotStatus cachedStatus = queueManager.getSlotStatus(id);
        ParkingSlot slot = parkingSlotRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Parking slot not found with id: " + id));
        
        if (cachedStatus != null && cachedStatus != slot.getStatus()) {
            slot.setStatus(cachedStatus);
        }
        
        return mapToDTO(slot);
    }

    @Transactional
    public ParkingSlotDTO updateSlotStatus(Long id, String statusStr) {
        ParkingSlot slot = parkingSlotRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Parking slot not found with id: " + id));

        ParkingSlot.SlotStatus oldStatus = slot.getStatus();
        ParkingSlot.SlotStatus newStatus = ParkingSlot.SlotStatus.valueOf(statusStr.toUpperCase());
        
        if (oldStatus != newStatus) {
            slot.setStatus(newStatus);
            ParkingSlot updatedSlot = parkingSlotRepository.save(slot);
            queueManager.updateSlotStatus(id, newStatus);
            
            // Adjust parent parking lot available slots counter
            ParkingLot lot = slot.getParkingZone().getParkingLot();
            if (oldStatus == ParkingSlot.SlotStatus.AVAILABLE) {
                lot.setAvailableSlots(Math.max(0, lot.getAvailableSlots() - 1));
            } else if (newStatus == ParkingSlot.SlotStatus.AVAILABLE) {
                lot.setAvailableSlots(Math.min(lot.getTotalSlots(), lot.getAvailableSlots() + 1));
            }
            parkingLotRepository.save(lot);
            
            auditLogService.logAction("UPDATE_SLOT_STATUS", "ParkingSlot", id);
            
            return mapToDTO(updatedSlot);
        }
        
        return mapToDTO(slot);
    }

    @Transactional
    public void deleteSlot(Long id) {
        ParkingSlot slot = parkingSlotRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Parking slot not found with id: " + id));
        
        ParkingLot lot = slot.getParkingZone().getParkingLot();
        lot.setTotalSlots(Math.max(0, lot.getTotalSlots() - 1));
        lot.setAvailableSlots(Math.max(0, lot.getAvailableSlots() - 1));
        parkingLotRepository.save(lot);

        parkingSlotRepository.delete(slot);
        queueManager.updateSlotStatus(id, null); // remove from cache
        
        auditLogService.logAction("DELETE_SLOT", "ParkingSlot", id);
    }

    public ParkingSlotDTO mapToDTO(ParkingSlot slot) {
        return ParkingSlotDTO.builder()
                .id(slot.getId())
                .slotNumber(slot.getSlotNumber())
                .slotType(slot.getSlotType().name())
                .status(slot.getStatus().name())
                .parkingZoneId(slot.getParkingZone().getId())
                .parkingLotId(slot.getParkingZone().getParkingLot().getId())
                .build();
    }
}
