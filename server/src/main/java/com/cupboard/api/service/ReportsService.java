package com.cupboard.api.service;

import com.cupboard.api.dto.dashboard.*;
import com.cupboard.api.enums.OrderStatus;
import com.cupboard.api.repository.OrderItemRepository;
import com.cupboard.api.repository.OrderRepository;
import com.cupboard.api.repository.PaymentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class ReportsService {

    @Autowired private PaymentRepository paymentRepository;
    @Autowired private OrderRepository orderRepository;
    @Autowired private OrderItemRepository orderItemRepository;
    @Autowired private DashboardService dashboardService;

    @Transactional(readOnly = true)
    public ReportsResponse getReportsData() {
        LocalDateTime startOfThisMonth = LocalDateTime.now()
                .withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);

        List<RevenueByMonth> revenueByMonth = dashboardService.buildRevenueByMonth(startOfThisMonth, 12);
        List<TopClient> topClients = buildTopClients();
        List<TopProduct> topProducts = buildTopProducts();
        List<OrderVolumeByMonth> orderVolumeByMonth = buildOrderVolumeByMonth(startOfThisMonth);

        return new ReportsResponse(revenueByMonth, topClients, topProducts, orderVolumeByMonth);
    }

    private List<TopClient> buildTopClients() {
        return paymentRepository.findTopClientsByRevenue(PageRequest.of(0, 5))
                .stream()
                .map(row -> new TopClient(
                        ((Number) row[0]).longValue(),
                        (String) row[1],
                        ((Number) row[2]).longValue(),
                        ((Number) row[3]).longValue()))
                .toList();
    }

    private List<TopProduct> buildTopProducts() {
        return orderItemRepository.findTopProductsByRevenue(PageRequest.of(0, 5))
                .stream()
                .map(row -> new TopProduct(
                        ((Number) row[0]).longValue(),
                        (String) row[1],
                        (String) row[2],
                        ((Number) row[3]).longValue(),
                        ((Number) row[4]).longValue()))
                .toList();
    }

    private List<OrderVolumeByMonth> buildOrderVolumeByMonth(LocalDateTime startOfThisMonth) {
        List<OrderVolumeByMonth> result = new ArrayList<>();
        for (int i = 11; i >= 0; i--) {
            LocalDateTime monthStart = startOfThisMonth.minusMonths(i);
            LocalDateTime monthEnd = monthStart.plusMonths(1);
            long count = orderRepository.countByCreatedAtBetween(monthStart, monthEnd);
            String label = monthStart.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH);
            result.add(new OrderVolumeByMonth(label, count));
        }
        return result;
    }
}
