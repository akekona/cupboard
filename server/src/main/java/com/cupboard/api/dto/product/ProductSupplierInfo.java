package com.cupboard.api.dto.product;

public record ProductSupplierInfo(
        Long id,
        String supplierName,
        Long costPrice,
        String currency,
        int leadTimeDays,
        boolean isPreferred
) {}
