package com.cupboard.api.dto.client;

import java.util.List;

public record ClientDetailResponse(
        Long id,
        String name,
        String contactName,
        String contactEmail,
        String contactPhone,
        String address,
        String accountStatus,
        Long orderCount,
        Long totalSpend,
        Long outstandingBalance,
        List<OrderSummary> recentOrders
) {}
