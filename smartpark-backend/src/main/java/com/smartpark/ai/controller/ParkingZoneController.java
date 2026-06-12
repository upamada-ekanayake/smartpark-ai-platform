package com.smartpark.ai.controller;

import com.smartpark.ai.dto.ParkingZoneDTO;
import com.smartpark.ai.service.ParkingZoneService;
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
@RequestMapping("/api/zones")
@RequiredArgsConstructor
@Tag(name = "Parking Zone Management", description = "Endpoints for configuring parking lot zones")
@SecurityRequirement(name = "bearerAuth")
public class ParkingZoneController {

    private final ParkingZoneService parkingZoneService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create a new parking zone (Admin only)")
    public ResponseEntity<ParkingZoneDTO> createZone(@Valid @RequestBody ParkingZoneDTO dto) {
        return ResponseEntity.ok(parkingZoneService.createZone(dto));
    }

    @GetMapping("/lot/{lotId}")
    @Operation(summary = "Get all parking zones within a specific parking lot")
    public ResponseEntity<List<ParkingZoneDTO>> getZonesByLot(@PathVariable Long lotId) {
        return ResponseEntity.ok(parkingZoneService.getZonesByLotId(lotId));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get parking zone details by ID")
    public ResponseEntity<ParkingZoneDTO> getZoneById(@PathVariable Long id) {
        return ResponseEntity.ok(parkingZoneService.getZoneById(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update parking zone details (Admin only)")
    public ResponseEntity<ParkingZoneDTO> updateZone(@PathVariable Long id, @Valid @RequestBody ParkingZoneDTO dto) {
        return ResponseEntity.ok(parkingZoneService.updateZone(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete parking zone (Admin only)")
    public ResponseEntity<Void> deleteZone(@PathVariable Long id) {
        parkingZoneService.deleteZone(id);
        return ResponseEntity.noContent().build();
    }
}
