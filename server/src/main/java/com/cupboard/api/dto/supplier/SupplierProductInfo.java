package com.cupboard.api.dto.supplier;

public record SupplierProductInfo(
        Long productId,
        String productName,
        String sku,
        Long costPrice,
        String currency,
        int leadTimeDays,
        boolean isPreferred
) {}
