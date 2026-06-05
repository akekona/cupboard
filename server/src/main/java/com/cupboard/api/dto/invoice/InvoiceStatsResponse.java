package com.cupboard.api.dto.invoice;

public record InvoiceStatsResponse(
        Long totalOutstanding,
        Long totalOverdue,
        Long totalPaidThisMonth,
        int overdueCount,
        int outstandingCount
) {}
