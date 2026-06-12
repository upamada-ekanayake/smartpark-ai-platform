package com.smartpark.ai.controller;

import com.smartpark.ai.dto.BookingRequestDTO;
import com.smartpark.ai.dto.BookingResponseDTO;
import com.smartpark.ai.entity.User;
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
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
@Tag(name = "Booking Management", description = "Vehicle parking reservation and cancellation endpoints")
@SecurityRequirement(name = "bearerAuth")
public class BookingController {

    private final BookingService bookingService;

    @PostMapping
    @Operation(summary = "Request a parking slot reservation (Triggers waiting lists if full)")
    public ResponseEntity<BookingResponseDTO> createBooking(
            @Valid @RequestBody BookingRequestDTO dto,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(bookingService.createBooking(dto, currentUser.getId()));
    }

    @GetMapping
    @Operation(summary = "Get bookings history (User gets own, Admin gets all)")
    public ResponseEntity<List<BookingResponseDTO>> getBookings(@AuthenticationPrincipal User currentUser) {
        if (currentUser.getRole() == User.Role.ADMIN) {
            return ResponseEntity.ok(bookingService.getAllBookings());
        }
        return ResponseEntity.ok(bookingService.getBookingHistory(currentUser.getId()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get booking details by ID")
    public ResponseEntity<BookingResponseDTO> getBookingById(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser
    ) {
        BookingResponseDTO booking = bookingService.getBookingById(id);
        if (!booking.getUserId().equals(currentUser.getId()) && currentUser.getRole() != User.Role.ADMIN) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(booking);
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "Cancel a reservation (Releases slot and processes waiting queue)")
    public ResponseEntity<BookingResponseDTO> cancelBooking(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser
    ) {
        BookingResponseDTO booking = bookingService.getBookingById(id);
        if (!booking.getUserId().equals(currentUser.getId()) && currentUser.getRole() != User.Role.ADMIN) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(bookingService.cancelBooking(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Hard delete booking record (Admin only)")
    public ResponseEntity<Void> deleteBooking(@PathVariable Long id) {
        bookingService.deleteBooking(id);
        return ResponseEntity.noContent().build();
    }
}
