package com.cupboard.api.dto.dashboard;

public record TopProduct(
        Long productId,
        String productName,
        String sku,
        long totalQuantity,
        Long totalRevenue
) {}
