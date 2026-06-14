package com.cupboard.api.dto.debug;

public record OrderItemDebugInfo(
        String productName,
        String sku,
        int quantity,
        long unitPrice
) {}
