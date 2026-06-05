package com.cupboard.api.dto.order;

import com.cupboard.api.enums.Currency;
import com.cupboard.api.enums.OrderStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record OrderSummaryResponse(
        Long id,
        Long clientId,
        String clientName,
        String createdByName,
        OrderStatus status,
        Currency currency,
        Long subtotal,
        LocalDate needBy,
        LocalDateTime createdAt,
        int itemCount
) {}
