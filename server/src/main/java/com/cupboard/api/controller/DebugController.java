package com.cupboard.api.controller;

import com.cupboard.api.dto.ApiResponse;
import com.cupboard.api.dto.debug.OrderDebugResponse;
import com.cupboard.api.service.DebugService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/debug")
@PreAuthorize("hasAnyRole('ADMIN', 'DEVELOPER')")
public class DebugController {

    @Autowired private DebugService debugService;

    @GetMapping("/orders/{orderId}")
    public ResponseEntity<ApiResponse<OrderDebugResponse>> getOrderDebugInfo(
            @PathVariable Long orderId) {
        return ResponseEntity.ok(ApiResponse.ok(debugService.getOrderDebugInfo(orderId)));
    }
}
