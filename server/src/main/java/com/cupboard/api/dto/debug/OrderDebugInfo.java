package com.cupboard.api.dto.debug;

import java.util.List;

public record OrderDebugInfo(
        Long id,
        String orderNumber,
        String status,
        String clientName,
        Long clientId,
        String createdByName,
        String createdAt,
        String needBy,
        long totalAmount,
        String currency,
        List<OrderItemDebugInfo> items
) {}
