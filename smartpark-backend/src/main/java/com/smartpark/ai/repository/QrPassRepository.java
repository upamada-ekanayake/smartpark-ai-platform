package com.smartpark.ai.repository;

import com.smartpark.ai.entity.QrPass;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface QrPassRepository extends JpaRepository<QrPass, Long> {
    Optional<QrPass> findByPassToken(String passToken);
    Optional<QrPass> findByBookingId(Long bookingId);
}
