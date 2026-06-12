package com.smartpark.ai.controller;

import com.smartpark.ai.dto.ReportsDTO;
import com.smartpark.ai.service.ReportsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@Tag(name = "Platform Reports", description = "Administrative financial and operations reports")
@SecurityRequirement(name = "bearerAuth")
public class ReportsController {

    private final ReportsService reportsService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Generate administrative reports (Daily, Weekly, Monthly) - Admin only")
    public ResponseEntity<ReportsDTO> generateReport(@RequestParam String period) {
        return ResponseEntity.ok(reportsService.generateReport(period));
    }
}
