package com.cupboard.api.dto.product;

import com.cupboard.api.enums.Currency;

import java.util.List;

public record ProductResponse(
        Long id,
        String sku,
        String name,
        String description,
        String category,
        Long unitPrice,
        Currency currency,
        String unit,
        int stockQuantity,
        int reorderThreshold,
        boolean isLowStock,
        List<ProductSupplierInfo> suppliers
) {}
