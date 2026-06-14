package com.cupboard.api.dto.ai;

public record RestockSuggestionItem(
        Long productId,
        String productName,
        String sku,
        int currentStock,
        int reorderThreshold,
        String urgency,
        String supplierName,
        Integer leadTimeDays,
        int suggestedQty,
        Long estimatedCost,
        String note
) {}
