package com.cupboard.api.dto.payment;

public record PaymentStatsResponse(
        Long collectedThisMonth,
        Long pending,
        Long refunded
) {}
