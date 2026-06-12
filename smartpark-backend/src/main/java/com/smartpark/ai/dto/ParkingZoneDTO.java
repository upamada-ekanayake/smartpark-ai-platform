package com.smartpark.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParkingZoneDTO {
    private Long id;
    private String name;
    private String zoneType; // "REGULAR", "VIP", "STAFF", "ACCESSIBLE"
    private BigDecimal pricePerHour;
    private Double distanceFromEntrance;
    private Long parkingLotId;
}
