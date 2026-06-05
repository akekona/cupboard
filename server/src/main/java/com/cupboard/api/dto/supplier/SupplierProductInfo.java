package com.cupboard.api.dto.supplier;

import com.cupboard.api.enums.Currency;

public record SupplierProductInfo(
        Long productId,
        String productName,
        String sku,
        Long costPrice,
        Currency currency,
        int leadTimeDays,
        boolean isPreferred
) {}
