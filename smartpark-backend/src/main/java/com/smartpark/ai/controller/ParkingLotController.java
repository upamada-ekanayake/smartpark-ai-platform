package com.smartpark.ai.controller;

import com.smartpark.ai.dto.ParkingLotDTO;
import com.smartpark.ai.dto.ParkingSlotDTO;
import com.smartpark.ai.service.ParkingLotService;
import com.smartpark.ai.service.ParkingSlotService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/parking-lots")
@RequiredArgsConstructor
@Tag(name = "Parking Lot Management", description = "Parking lot and slot allocation endpoints")
@SecurityRequirement(name = "bearerAuth")
public class ParkingLotController {

    private final ParkingLotService parkingLotService;
    private final ParkingSlotService parkingSlotService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create a new parking lot (Admin only)")
    public ResponseEntity<ParkingLotDTO> createParkingLot(@Valid @RequestBody ParkingLotDTO dto) {
        return ResponseEntity.ok(parkingLotService.createParkingLot(dto));
    }

    @GetMapping
    @Operation(summary = "Get all parking lots")
    public ResponseEntity<List<ParkingLotDTO>> getAllParkingLots() {
        return ResponseEntity.ok(parkingLotService.getAllParkingLots());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get parking lot details by ID")
    public ResponseEntity<ParkingLotDTO> getParkingLotById(@PathVariable Long id) {
        return ResponseEntity.ok(parkingLotService.getParkingLotById(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update parking lot details (Admin only)")
    public ResponseEntity<ParkingLotDTO> updateParkingLot(
            @PathVariable Long id,
            @Valid @RequestBody ParkingLotDTO dto
    ) {
        return ResponseEntity.ok(parkingLotService.updateParkingLot(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete parking lot by ID (Admin only)")
    public ResponseEntity<Void> deleteParkingLot(@PathVariable Long id) {
        parkingLotService.deleteParkingLot(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/slots")
    @Operation(summary = "Get all slots inside a parking lot")
    public ResponseEntity<List<ParkingSlotDTO>> getSlotsForLot(@PathVariable Long id) {
        return ResponseEntity.ok(parkingSlotService.getSlotsByLotId(id));
    }
}
