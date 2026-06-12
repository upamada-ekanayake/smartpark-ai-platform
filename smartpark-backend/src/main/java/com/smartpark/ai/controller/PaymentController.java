package com.smartpark.ai.controller;

import com.smartpark.ai.dto.PaymentDTO;
import com.smartpark.ai.dto.BookingResponseDTO;
import com.smartpark.ai.entity.User;
import com.smartpark.ai.service.PaymentService;
import com.smartpark.ai.service.BookingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Tag(name = "Payment Management", description = "Transaction processing and validation endpoints")
@SecurityRequirement(name = "bearerAuth")
public class PaymentController {

    private final PaymentService paymentService;
    private final BookingService bookingService;

    @PostMapping
    @Operation(summary = "Process booking payment")
    public ResponseEntity<PaymentDTO> processPayment(@Valid @RequestBody PaymentDTO dto) {
        return ResponseEntity.ok(paymentService.processPayment(dto));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all payments (Admin only)")
    public ResponseEntity<List<PaymentDTO>> getAllPayments() {
        return ResponseEntity.ok(paymentService.getAllPayments());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get payment by ID")
    public ResponseEntity<PaymentDTO> getPaymentById(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser
    ) {
        PaymentDTO payment = paymentService.getPaymentById(id);
        BookingResponseDTO booking = bookingService.getBookingById(payment.getBookingId());
        if (!booking.getUserId().equals(currentUser.getId()) && currentUser.getRole() != User.Role.ADMIN) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(payment);
    }

    @GetMapping("/booking/{bookingId}")
    @Operation(summary = "Get payment details by booking ID")
    public ResponseEntity<PaymentDTO> getPaymentByBookingId(
            @PathVariable Long bookingId,
            @AuthenticationPrincipal User currentUser
    ) {
        BookingResponseDTO booking = bookingService.getBookingById(bookingId);
        if (!booking.getUserId().equals(currentUser.getId()) && currentUser.getRole() != User.Role.ADMIN) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(paymentService.getPaymentByBookingId(bookingId));
    }
}
