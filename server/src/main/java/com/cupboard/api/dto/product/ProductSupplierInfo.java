package com.cupboard.api.dto.product;

import com.cupboard.api.enums.Currency;

public record ProductSupplierInfo(
        Long id,
        String supplierName,
        Long costPrice,
        Currency currency,
        int leadTimeDays,
        boolean isPreferred
) {}
