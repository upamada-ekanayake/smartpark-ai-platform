package com.smartpark.ai.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "qr_passes")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QrPass {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "pass_token", nullable = false, unique = true)
    private String passToken;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false, unique = true)
    @ToString.Exclude
    private Booking booking;

    @PrePersist
    protected void onCreate() {
        if (isActive == null) {
            isActive = true;
        }
    }
}
