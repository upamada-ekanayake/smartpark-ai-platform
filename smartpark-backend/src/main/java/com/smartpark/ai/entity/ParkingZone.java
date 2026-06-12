package com.smartpark.ai.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "parking_zones")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParkingZone {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "zone_type", nullable = false, length = 20)
    private ZoneType zoneType;

    @Column(name = "price_per_hour", nullable = false, precision = 10, scale = 2)
    private BigDecimal pricePerHour;

    @Column(name = "distance_from_entrance", nullable = false)
    private Double distanceFromEntrance;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parking_lot_id", nullable = false)
    @ToString.Exclude
    private ParkingLot parkingLot;

    public enum ZoneType {
        REGULAR,
        VIP,
        STAFF,
        ACCESSIBLE
    }
}
