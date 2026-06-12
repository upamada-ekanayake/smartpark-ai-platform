package com.smartpark.ai.controller;

import com.smartpark.ai.dto.VehicleDTO;
import com.smartpark.ai.entity.User;
import com.smartpark.ai.service.VehicleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vehicles")
@RequiredArgsConstructor
@Tag(name = "Vehicle Management", description = "Vehicle registration and management endpoints")
@SecurityRequirement(name = "bearerAuth")
public class VehicleController {

    private final VehicleService vehicleService;

    @PostMapping
    @Operation(summary = "Add a new vehicle")
    public ResponseEntity<VehicleDTO> addVehicle(
            @Valid @RequestBody VehicleDTO dto,
            @AuthenticationPrincipal User currentUser
    ) {
        // Enforce user ID of current user unless Admin is doing it
        if (currentUser.getRole() != User.Role.ADMIN) {
            dto.setUserId(currentUser.getId());
        } else if (dto.getUserId() == null) {
            dto.setUserId(currentUser.getId());
        }
        return ResponseEntity.ok(vehicleService.addVehicle(dto));
    }

    @GetMapping
    @Operation(summary = "List vehicles (User gets own, Admin gets all)")
    public ResponseEntity<List<VehicleDTO>> getVehicles(@AuthenticationPrincipal User currentUser) {
        if (currentUser.getRole() == User.Role.ADMIN) {
            return ResponseEntity.ok(vehicleService.getAllVehicles());
        }
        return ResponseEntity.ok(vehicleService.getVehiclesByUserId(currentUser.getId()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get vehicle details by ID")
    public ResponseEntity<VehicleDTO> getVehicleById(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser
    ) {
        VehicleDTO vehicle = vehicleService.getVehicleById(id);
        if (!vehicle.getUserId().equals(currentUser.getId()) && currentUser.getRole() != User.Role.ADMIN) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(vehicle);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update vehicle details")
    public ResponseEntity<VehicleDTO> updateVehicle(
            @PathVariable Long id,
            @Valid @RequestBody VehicleDTO dto,
            @AuthenticationPrincipal User currentUser
    ) {
        VehicleDTO vehicle = vehicleService.getVehicleById(id);
        if (!vehicle.getUserId().equals(currentUser.getId()) && currentUser.getRole() != User.Role.ADMIN) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(vehicleService.updateVehicle(id, dto));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete vehicle by ID")
    public ResponseEntity<Void> deleteVehicle(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser
    ) {
        VehicleDTO vehicle = vehicleService.getVehicleById(id);
        if (!vehicle.getUserId().equals(currentUser.getId()) && currentUser.getRole() != User.Role.ADMIN) {
            return ResponseEntity.status(403).build();
        }
        vehicleService.deleteVehicle(id);
        return ResponseEntity.noContent().build();
    }
}
