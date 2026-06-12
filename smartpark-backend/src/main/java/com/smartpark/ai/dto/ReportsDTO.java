package com.smartpark.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportsDTO {
    private String period; // "DAILY", "WEEKLY", "MONTHLY", "REVENUE"
    private BigDecimal totalRevenue;
    private Long totalBookings;
    private Long completedBookings;
    private Long cancelledBookings;
    private Double averageOccupancyRate;
    private Map<String, Long> paymentsMethodCount;
}
