package com.cupboard.api.dto.order;

import com.cupboard.api.enums.Currency;

public record OrderItemResponse(
        Long id,
        Long productId,
        String productName,
        String productSku,
        int quantity,
        Long unitPrice,
        Currency currency,
        Long lineTotal
) {}
