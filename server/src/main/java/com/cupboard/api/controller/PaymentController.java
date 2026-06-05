package com.cupboard.api.controller;

import com.cupboard.api.dto.ApiResponse;
import com.cupboard.api.dto.payment.PaymentResponse;
import com.cupboard.api.dto.payment.PaymentStatsResponse;
import com.cupboard.api.service.PaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    @Autowired private PaymentService paymentService;

    @GetMapping
    public ApiResponse<List<PaymentResponse>> getAll(
            @RequestParam(required = false) Long invoiceId) {
        return ApiResponse.ok(paymentService.getAllPayments(invoiceId));
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
