package com.smartpark.ai.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParkingSlotDTO {
    private Long id;

    @NotBlank(message = "Slot number is required")
    private String slotNumber;

    @NotBlank(message = "Slot type is required")
    private String slotType; // "REGULAR", "VIP", "STAFF", "ACCESSIBLE"

    private String status; // "AVAILABLE", "RESERVED", "OCCUPIED"

    @NotNull(message = "Parking zone ID is required")
    private Long parkingZoneId;
    
    private Long parkingLotId;
}
