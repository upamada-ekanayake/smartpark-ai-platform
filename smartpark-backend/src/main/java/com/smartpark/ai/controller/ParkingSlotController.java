package com.smartpark.ai.controller;

import com.smartpark.ai.dto.ParkingSlotDTO;
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
@RequestMapping("/api/slots")
@RequiredArgsConstructor
@Tag(name = "Parking Slot Management", description = "Individual parking slot configuration endpoints")
@SecurityRequirement(name = "bearerAuth")
public class ParkingSlotController {

    private final ParkingSlotService parkingSlotService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create a new parking slot (Admin only)")
    public ResponseEntity<ParkingSlotDTO> createSlot(@Valid @RequestBody ParkingSlotDTO dto) {
        return ResponseEntity.ok(parkingSlotService.createSlot(dto));
    }

    @GetMapping
    @Operation(summary = "Get all parking slots")
    public ResponseEntity<List<ParkingSlotDTO>> getAllSlots() {
        return ResponseEntity.ok(parkingSlotService.getAllSlots());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get slot by ID (Fast lookup)")
    public ResponseEntity<ParkingSlotDTO> getSlotById(@PathVariable Long id) {
        return ResponseEntity.ok(parkingSlotService.getSlotById(id));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update slot status (Admin only)")
    public ResponseEntity<ParkingSlotDTO> updateSlotStatus(
            @PathVariable Long id,
            @RequestParam String status
    ) {
        return ResponseEntity.ok(parkingSlotService.updateSlotStatus(id, status));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete parking slot (Admin only)")
    public ResponseEntity<Void> deleteSlot(@PathVariable Long id) {
        parkingSlotService.deleteSlot(id);
        return ResponseEntity.noContent().build();
    }
}
