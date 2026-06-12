package com.smartpark.ai.controller;

import com.smartpark.ai.entity.QrPass;
import com.smartpark.ai.entity.User;
import com.smartpark.ai.dto.BookingResponseDTO;
import com.smartpark.ai.service.QrPassService;
import com.smartpark.ai.service.BookingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/qr-passes")
@RequiredArgsConstructor
@Tag(name = "QR Access Passes", description = "Access pass validation and entry/exit registration")
@SecurityRequirement(name = "bearerAuth")
public class QrPassController {

    private final QrPassService qrPassService;
    private final BookingService bookingService;

    @GetMapping("/booking/{bookingId}")
    @Operation(summary = "Get QR pass details for a specific booking")
    public ResponseEntity<QrPass> getPassByBooking(
            @PathVariable Long bookingId,
            @AuthenticationPrincipal User currentUser
    ) {
        BookingResponseDTO booking = bookingService.getBookingById(bookingId);
        if (!booking.getUserId().equals(currentUser.getId()) && currentUser.getRole() != User.Role.ADMIN) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(qrPassService.getPassByBookingId(bookingId));
    }

    @PostMapping("/scan")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Scan QR pass at entrance/exit gate (Admin/Security only)")
    public ResponseEntity<Map<String, String>> scanPass(@RequestParam String token) {
        String result = qrPassService.scanPass(token);
        return ResponseEntity.ok(Map.of("status", "SUCCESS", "message", result));
    }
}
