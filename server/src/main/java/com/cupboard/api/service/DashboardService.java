package com.cupboard.api.service;

import com.cupboard.api.dto.dashboard.*;
import com.cupboard.api.entity.Invoice;
import com.cupboard.api.entity.Order;
import com.cupboard.api.entity.Product;
import com.cupboard.api.enums.InvoiceStatus;
import com.cupboard.api.enums.OrderStatus;
import com.cupboard.api.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.stream.Stream;

@Service
public class DashboardService {

    @Autowired private PaymentRepository paymentRepository;
    @Autowired private InvoiceRepository invoiceRepository;
    @Autowired private OrderRepository orderRepository;
    @Autowired private ProductRepository productRepository;

    @Transactional(readOnly = true)
    public DashboardResponse getDashboardData() {
        LocalDateTime startOfThisMonth = LocalDateTime.now()
                .withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime startOfLastMonth = startOfThisMonth.minusMonths(1);
        LocalDateTime startOfNextMonth = startOfThisMonth.plusMonths(1);

        DashboardStats stats = buildStats(startOfThisMonth, startOfLastMonth, startOfNextMonth);
        List<RevenueByMonth> revenueByMonth = buildRevenueByMonth(startOfThisMonth, 6);
        List<ActivityItem> recentActivity = buildRecentActivity();

        return new DashboardResponse(stats, revenueByMonth, recentActivity);
    }

    private DashboardStats buildStats(LocalDateTime startOfThisMonth,
                                      LocalDateTime startOfLastMonth,
                                      LocalDateTime startOfNextMonth) {
        Long totalRevenueThisMonth = paymentRepository.sumSucceededBetween(startOfThisMonth, startOfNextMonth);
        Long revenueLastMonth = paymentRepository.sumSucceededBetween(startOfLastMonth, startOfThisMonth);
        long ordersThisMonth = orderRepository.countByCreatedAtBetween(startOfThisMonth, startOfNextMonth);
        long ordersLastMonth = orderRepository.countByCreatedAtBetween(startOfLastMonth, startOfThisMonth);
        int lowStockCount = productRepository.findAllByDeletedAtIsNullAndStockQuantityLessThanEqualReorderThreshold().size();
        Long outstandingInvoicesAmount = invoiceRepository.getTotalOutstanding();
        int outstandingInvoicesCount = invoiceRepository.countOutstanding();
        int overdueInvoicesCount = invoiceRepository.countOverdue();

        return new DashboardStats(
                totalRevenueThisMonth,
                revenueLastMonth,
                ordersThisMonth,
                ordersLastMonth,
                lowStockCount,
                outstandingInvoicesAmount,
                outstandingInvoicesCount,
                overdueInvoicesCount
        );
    }

    List<RevenueByMonth> buildRevenueByMonth(LocalDateTime startOfThisMonth, int months) {
        List<RevenueByMonth> result = new ArrayList<>();
        for (int i = months - 1; i >= 0; i--) {
            LocalDateTime monthStart = startOfThisMonth.minusMonths(i);
            LocalDateTime monthEnd = monthStart.plusMonths(1);
            Long revenue = paymentRepository.sumSucceededBetween(monthStart, monthEnd);
            String label = monthStart.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH);
            result.add(new RevenueByMonth(label, revenue));
        }
        return result;
    }

    private List<ActivityItem> buildRecentActivity() {
        List<Order> recentOrders = orderRepository.findRecentByStatusIn(
                List.of(OrderStatus.CONFIRMED, OrderStatus.SHIPPED, OrderStatus.FULFILLED),
                PageRequest.of(0, 10));

        List<Invoice> recentInvoices = invoiceRepository.findRecentByStatusIn(
                List.of(InvoiceStatus.SENT, InvoiceStatus.PAID, InvoiceStatus.OVERDUE),
                PageRequest.of(0, 10));

        List<Product> lowStockProducts =
                productRepository.findAllByDeletedAtIsNullAndStockQuantityLessThanEqualReorderThreshold();

        List<ActivityItem> orderItems = recentOrders.stream()
                .map(o -> new ActivityItem(
                        o.getId(),
                        "ORDER_" + o.getStatus().name(),
                        "Order #" + o.getId() + " status → " + o.getStatus().name(),
                        o.getClient().getName(),
                        o.getCreatedAt()))
                .toList();

        List<ActivityItem> invoiceItems = recentInvoices.stream()
                .map(i -> new ActivityItem(
                        i.getId(),
                        "INVOICE_" + i.getStatus().name(),
                        "Invoice " + i.getInvoiceNumber() + " marked as " + i.getStatus().name(),
                        i.getClient().getName(),
                        i.getCreatedAt()))
                .toList();

        List<ActivityItem> stockItems = lowStockProducts.stream()
                .map(p -> new ActivityItem(
                        p.getId(),
                        "LOW_STOCK",
                        p.getName() + " below reorder threshold",
                        p.getSku(),
                        p.getUpdatedAt()))
                .toList();

        return Stream.of(orderItems, invoiceItems, stockItems)
                .flatMap(List::stream)
                .sorted(Comparator.comparing(ActivityItem::createdAt).reversed())
                .limit(10)
                .toList();
    }
}
