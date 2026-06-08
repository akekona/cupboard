package com.cupboard.api.dto.dashboard;

public record DashboardStats(
        Long totalRevenueThisMonth,
        Long revenueLastMonth,
        long ordersThisMonth,
        long ordersLastMonth,
        int lowStockCount,
        Long outstandingInvoicesAmount,
        int outstandingInvoicesCount,
        int overdueInvoicesCount
) {}
