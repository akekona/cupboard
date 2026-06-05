package com.cupboard.api.dto.client;

import com.cupboard.api.enums.Currency;
import com.cupboard.api.enums.OrderStatus;

import java.time.LocalDateTime;

public record OrderSummary(
        Long id,
        OrderStatus status,
        Long totalAmount,
        Currency currency,
        LocalDateTime createdAt
) {}
