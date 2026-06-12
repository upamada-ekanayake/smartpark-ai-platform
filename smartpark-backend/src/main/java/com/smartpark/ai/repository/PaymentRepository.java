package com.smartpark.ai.repository;

import com.smartpark.ai.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByBookingId(Long bookingId);
    List<Payment> findByBookingIdInAndPaymentStatus(List<Long> bookingIds, Payment.PaymentStatus status);
}
