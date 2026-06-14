package com.cupboard.api.dto.debug;

public record PaymentDebugInfo(
        Long id,
        String status,
        String paymentMethod,
        long amount,
        String currency,
        String createdAt,
        String stripePaymentId,
        String stripePaymentUrl
) {}
