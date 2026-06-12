package com.smartpark.ai.service;

import com.smartpark.ai.dto.ParkingLotDTO;
import com.smartpark.ai.entity.ParkingLot;
import com.smartpark.ai.exception.ResourceNotFoundException;
import com.smartpark.ai.repository.ParkingLotRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ParkingLotService {

    private final ParkingLotRepository parkingLotRepository;

    @Transactional
    public ParkingLotDTO createParkingLot(ParkingLotDTO dto) {
        ParkingLot lot = ParkingLot.builder()
                .name(dto.getName())
                .address(dto.getAddress())
                .totalSlots(dto.getTotalSlots())
                .availableSlots(dto.getTotalSlots()) // Initially all slots are available
                .openingTime(dto.getOpeningTime())
                .closingTime(dto.getClosingTime())
                .build();

        ParkingLot savedLot = parkingLotRepository.save(lot);
        return mapToDTO(savedLot);
    }

    public List<ParkingLotDTO> getAllParkingLots() {
        return parkingLotRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public ParkingLotDTO getParkingLotById(Long id) {
        ParkingLot lot = parkingLotRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Parking lot not found with id: " + id));
        return mapToDTO(lot);
    }

    @Transactional
    public ParkingLotDTO updateParkingLot(Long id, ParkingLotDTO dto) {
        ParkingLot lot = parkingLotRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Parking lot not found with id: " + id));

        int slotDifference = dto.getTotalSlots() - lot.getTotalSlots();
        lot.setName(dto.getName());
        lot.setAddress(dto.getAddress());
        lot.setTotalSlots(dto.getTotalSlots());
        lot.setAvailableSlots(Math.max(0, lot.getAvailableSlots() + slotDifference));
        lot.setOpeningTime(dto.getOpeningTime());
        lot.setClosingTime(dto.getClosingTime());

        ParkingLot updatedLot = parkingLotRepository.save(lot);
        return mapToDTO(updatedLot);
    }

    @Transactional
    public void deleteParkingLot(Long id) {
        if (!parkingLotRepository.existsById(id)) {
            throw new ResourceNotFoundException("Parking lot not found with id: " + id);
        }
        parkingLotRepository.deleteById(id);
    }

    public ParkingLotDTO mapToDTO(ParkingLot lot) {
        return ParkingLotDTO.builder()
                .id(lot.getId())
                .name(lot.getName())
                .address(lot.getAddress())
                .totalSlots(lot.getTotalSlots())
                .availableSlots(lot.getAvailableSlots())
                .openingTime(lot.getOpeningTime())
                .closingTime(lot.getClosingTime())
                .build();
    }
}
