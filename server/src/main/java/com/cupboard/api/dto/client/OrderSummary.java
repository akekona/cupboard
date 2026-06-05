package com.cupboard.api.dto.client;

import java.time.LocalDateTime;

public record OrderSummary(
        Long id,
        String status,
        Long totalAmount,
        String currency,
        LocalDateTime createdAt
) {}
