package com.smartpark.ai.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "parking_slots", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"parking_zone_id", "slot_number"})
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParkingSlot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "slot_number", nullable = false, length = 20)
    private String slotNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "slot_type", nullable = false, length = 20)
    private SlotType slotType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SlotStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parking_zone_id", nullable = false)
    @ToString.Exclude
    private ParkingZone parkingZone;

    public enum SlotStatus {
        AVAILABLE,
        RESERVED,
        OCCUPIED
    }

    public enum SlotType {
        REGULAR,
        VIP,
        STAFF,
        ACCESSIBLE
    }
}
