package com.smartpark.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingResponseDTO {
    private Long id;
    private String bookingReference;
    private LocalDateTime bookingDate;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String status;
    private Long userId;
    private String userEmail;
    private Long vehicleId;
    private String vehicleNumber;
    private Long slotId;
    private String slotNumber;
    private Long parkingLotId;
    private String parkingLotName;
}
