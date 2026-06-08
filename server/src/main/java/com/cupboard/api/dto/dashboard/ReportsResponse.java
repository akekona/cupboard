package com.cupboard.api.dto.dashboard;

import java.util.List;

public record ReportsResponse(
        List<RevenueByMonth> revenueByMonth,
        List<TopClient> topClients,
        List<TopProduct> topProducts,
        List<OrderVolumeByMonth> orderVolumeByMonth
) {}
