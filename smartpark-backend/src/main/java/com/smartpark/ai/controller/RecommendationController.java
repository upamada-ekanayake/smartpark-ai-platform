package com.smartpark.ai.controller;

import com.smartpark.ai.dto.ParkingSlotDTO;
import com.smartpark.ai.service.RecommendationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recommendations")
@RequiredArgsConstructor
@Tag(name = "Parking Slot Recommendations", description = "AI recommendation service for optimized slot suggestions")
@SecurityRequirement(name = "bearerAuth")
public class RecommendationController {

    private final RecommendationService recommendationService;

    @GetMapping
    @Operation(summary = "Get top 5 recommended slots in a lot by price, distance and occupancy")
    public ResponseEntity<List<ParkingSlotDTO>> getRecommendedSlots(
            @RequestParam Long parkingLotId,
            @RequestParam(required = false) String preferredZoneType
    ) {
        return ResponseEntity.ok(recommendationService.recommendSlots(parkingLotId, preferredZoneType));
    }
}
