package com.cupboard.api.controller;

import com.cupboard.api.dto.ApiResponse;
import com.cupboard.api.dto.PagedResponse;
import com.cupboard.api.dto.payment.PaymentResponse;
import com.cupboard.api.dto.payment.PaymentStatsResponse;
import com.cupboard.api.enums.PaymentMethod;
import com.cupboard.api.enums.PaymentStatus;
import com.cupboard.api.service.PaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    @Autowired private PaymentService paymentService;

    @GetMapping
    public ApiResponse<PagedResponse<PaymentResponse>> getAll(
            @RequestParam(required = false) PaymentStatus status,
            @RequestParam(required = false) PaymentMethod paymentMethod,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ApiResponse.ok(paymentService.getPaymentsPaginated(status, paymentMethod, search, month, year, page, size));
    }

    @GetMapping("/stats")
    public ApiResponse<PaymentStatsResponse> getStats() {
        return ApiResponse.ok(paymentService.getPaymentStats());
    }

    @GetMapping("/{id}")
    public ApiResponse<PaymentResponse> getById(@PathVariable Long id) {
        return ApiResponse.ok(paymentService.getPaymentById(id));
    }
}
