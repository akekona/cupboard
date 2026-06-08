package com.cupboard.api.controller;

import com.cupboard.api.dto.ApiResponse;
import com.cupboard.api.dto.dashboard.ReportsResponse;
import com.cupboard.api.service.ReportsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reports")
public class ReportsController {

    @Autowired private ReportsService reportsService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<ReportsResponse> getReports() {
        return ApiResponse.ok(reportsService.getReportsData());
    }
}
