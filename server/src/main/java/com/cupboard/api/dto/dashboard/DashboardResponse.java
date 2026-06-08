package com.cupboard.api.dto.dashboard;

import java.util.List;

public record DashboardResponse(
        DashboardStats stats,
        List<RevenueByMonth> revenueByMonth,
        List<ActivityItem> recentActivity
) {}
