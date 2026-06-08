package com.cupboard.api.dto.dashboard;

public record TopClient(
        Long clientId,
        String clientName,
        Long totalSpend,
        long orderCount
) {}
