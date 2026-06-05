package com.cupboard.api.dto.client;

import com.cupboard.api.enums.Currency;

import java.time.LocalDateTime;

public record OrderSummary(
        Long id,
        String status,
        Long totalAmount,
        Currency currency,
        LocalDateTime createdAt
) {}
