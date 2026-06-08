package com.cupboard.api.controller;

import com.cupboard.api.dto.ApiResponse;
import com.cupboard.api.dto.dashboard.DashboardResponse;
import com.cupboard.api.service.DashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    @Autowired private DashboardService dashboardService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ApiResponse<DashboardResponse> getDashboard() {
        return ApiResponse.ok(dashboardService.getDashboardData());
    }
}
