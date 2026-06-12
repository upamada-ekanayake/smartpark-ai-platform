package com.smartpark.ai.service;

import com.smartpark.ai.dto.ParkingZoneDTO;
import com.smartpark.ai.entity.ParkingLot;
import com.smartpark.ai.entity.ParkingZone;
import com.smartpark.ai.exception.ResourceNotFoundException;
import com.smartpark.ai.repository.ParkingLotRepository;
import com.smartpark.ai.repository.ParkingZoneRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ParkingZoneService {

    private final ParkingZoneRepository parkingZoneRepository;
    private final ParkingLotRepository parkingLotRepository;
    private final AuditLogService auditLogService;

    @Transactional
    public ParkingZoneDTO createZone(ParkingZoneDTO dto) {
        ParkingLot lot = parkingLotRepository.findById(dto.getParkingLotId())
                .orElseThrow(() -> new ResourceNotFoundException("Parking lot not found with id: " + dto.getParkingLotId()));

        ParkingZone zone = ParkingZone.builder()
                .name(dto.getName())
                .zoneType(ParkingZone.ZoneType.valueOf(dto.getZoneType().toUpperCase()))
                .pricePerHour(dto.getPricePerHour())
                .distanceFromEntrance(dto.getDistanceFromEntrance())
                .parkingLot(lot)
                .build();

        ParkingZone savedZone = parkingZoneRepository.save(zone);
        auditLogService.logAction("CREATE_ZONE", "ParkingZone", savedZone.getId());
        return mapToDTO(savedZone);
    }

    public List<ParkingZoneDTO> getZonesByLotId(Long lotId) {
        return parkingZoneRepository.findByParkingLotId(lotId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public List<ParkingZoneDTO> getAllZones() {
        return parkingZoneRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public ParkingZoneDTO getZoneById(Long id) {
        ParkingZone zone = parkingZoneRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Parking zone not found with id: " + id));
        return mapToDTO(zone);
    }

    @Transactional
    public ParkingZoneDTO updateZone(Long id, ParkingZoneDTO dto) {
        ParkingZone zone = parkingZoneRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Parking zone not found with id: " + id));

        zone.setName(dto.getName());
        zone.setZoneType(ParkingZone.ZoneType.valueOf(dto.getZoneType().toUpperCase()));
        zone.setPricePerHour(dto.getPricePerHour());
        zone.setDistanceFromEntrance(dto.getDistanceFromEntrance());

        ParkingZone updatedZone = parkingZoneRepository.save(zone);
        auditLogService.logAction("UPDATE_ZONE", "ParkingZone", updatedZone.getId());
        return mapToDTO(updatedZone);
    }

    @Transactional
    public void deleteZone(Long id) {
        if (!parkingZoneRepository.existsById(id)) {
            throw new ResourceNotFoundException("Parking zone not found with id: " + id);
        }
        parkingZoneRepository.deleteById(id);
        auditLogService.logAction("DELETE_ZONE", "ParkingZone", id);
    }

    public ParkingZoneDTO mapToDTO(ParkingZone zone) {
        return ParkingZoneDTO.builder()
                .id(zone.getId())
                .name(zone.getName())
                .zoneType(zone.getZoneType().name())
                .pricePerHour(zone.getPricePerHour())
                .distanceFromEntrance(zone.getDistanceFromEntrance())
                .parkingLotId(zone.getParkingLot().getId())
                .build();
    }
}
