package com.cupboard.api.service;

import com.cupboard.api.dto.debug.*;
import com.cupboard.api.entity.Invoice;
import com.cupboard.api.entity.Order;
import com.cupboard.api.entity.Payment;
import com.cupboard.api.enums.InvoiceStatus;
import com.cupboard.api.enums.OrderStatus;
import com.cupboard.api.exception.EntityNotFoundException;
import com.cupboard.api.repository.InvoiceRepository;
import com.cupboard.api.repository.OrderRepository;
import com.cupboard.api.repository.PaymentRepository;
import com.cupboard.api.util.OrderNumberFormatter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
public class DebugService {

    @Autowired private OrderRepository orderRepository;
    @Autowired private InvoiceRepository invoiceRepository;
    @Autowired private PaymentRepository paymentRepository;

    @Transactional(readOnly = true)
    public OrderDebugResponse getOrderDebugInfo(String orderIdentifier) {
        Long orderId;
        try {
            orderId = OrderNumberFormatter.parse(orderIdentifier);
        } catch (NumberFormatException e) {
            throw new EntityNotFoundException("Invalid order identifier: " + orderIdentifier);
        }

        Order order = orderRepository.findByIdWithDetails(orderId)
                .orElseThrow(() -> new EntityNotFoundException("Order " + orderIdentifier + " not found"));

        long totalAmount = order.getOrderItems().stream()
                .mapToLong(oi -> oi.getUnitPrice() * oi.getQuantity())
                .sum();

        List<OrderItemDebugInfo> items = order.getOrderItems().stream()
                .map(oi -> new OrderItemDebugInfo(
                        oi.getProduct().getName(),
                        oi.getProduct().getSku(),
                        oi.getQuantity(),
                        oi.getUnitPrice()
                ))
                .toList();

        OrderDebugInfo orderInfo = new OrderDebugInfo(
                order.getId(),
                OrderNumberFormatter.format(order.getId()),
                order.getStatus().name(),
                order.getClient().getName(),
                order.getClient().getId(),
                order.getCreatedBy().getFirstName() + " " + order.getCreatedBy().getLastName(),
                fmt(order.getCreatedAt()),
                fmt(order.getNeedBy()),
                totalAmount,
                order.getCurrency().name(),
                items
        );

        Optional<Invoice> invoiceOpt = invoiceRepository.findByOrderId(orderId);

        InvoiceDebugInfo invoiceInfo = invoiceOpt.map(inv -> new InvoiceDebugInfo(
                inv.getId(),
                inv.getInvoiceNumber(),
                inv.getStatus().name(),
                fmt(inv.getDueDate()),
                fmt(inv.getSentAt()),
                fmt(inv.getPaidAt()),
                inv.getTotalAmount(),
                inv.getCurrency().name(),
                inv.getStripeInvoiceId(),
                inv.getStripeInvoiceId() != null
                        ? "https://dashboard.stripe.com/test/invoices/" + inv.getStripeInvoiceId()
                        : null
        )).orElse(null);

        PaymentDebugInfo paymentInfo = null;
        if (invoiceOpt.isPresent()) {
            Optional<Payment> mostRecent = paymentRepository
                    .findAllByInvoiceId(invoiceOpt.get().getId()).stream()
                    .max(Comparator.comparing(Payment::getCreatedAt));
            paymentInfo = mostRecent.map(p -> new PaymentDebugInfo(
                    p.getId(),
                    p.getStatus().name(),
                    p.getPaymentMethod().name(),
                    p.getAmount(),
                    p.getCurrency().name(),
                    fmt(p.getCreatedAt()),
                    p.getStripePaymentId(),
                    p.getStripePaymentId() != null
                            ? "https://dashboard.stripe.com/test/payments/" + p.getStripePaymentId()
                            : null
            )).orElse(null);
        }

        List<String> flags = buildFlags(order, invoiceOpt.orElse(null), paymentInfo);

        return new OrderDebugResponse(orderInfo, invoiceInfo, paymentInfo, flags);
    }

    private List<String> buildFlags(Order order, Invoice invoice, PaymentDebugInfo payment) {
        List<String> flags = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        if (order.getStatus() == OrderStatus.CONFIRMED
                && order.getCreatedAt().isBefore(now.minusDays(1))
                && (invoice == null || invoice.getStatus() == InvoiceStatus.DRAFT)) {
            flags.add("Order confirmed but invoice still in draft");
        }

        if (invoice != null
                && invoice.getStatus() == InvoiceStatus.SENT
                && invoice.getSentAt() != null
                && invoice.getSentAt().isBefore(now.minusDays(30))
                && payment == null) {
            flags.add("Invoice sent over 30 days ago with no payment recorded");
        }

        if (invoice != null && invoice.getStatus() == InvoiceStatus.OVERDUE) {
            flags.add("Invoice is overdue");
        }

        if (invoice != null
                && invoice.getStatus() == InvoiceStatus.SENT
                && invoice.getDueDate() != null
                && invoice.getDueDate().isBefore(now.toLocalDate())) {
            flags.add("Invoice is past due date but status is still SENT (should be OVERDUE)");
        }

        if (payment != null && "FAILED".equals(payment.status())) {
            flags.add("Most recent payment attempt failed");
        }

        if (order.getStatus() == OrderStatus.SHIPPED
                && order.getCreatedAt().isBefore(now.minusDays(14))) {
            flags.add("Order has been SHIPPED for over 14 days without being marked FULFILLED");
        }

        if (invoice == null && order.getStatus() != OrderStatus.DRAFT) {
            flags.add("Order is not draft but has no associated invoice");
        }

        return flags;
    }

    private String fmt(LocalDateTime dt) {
        return dt != null ? dt.toString() : null;
    }

    private String fmt(LocalDate d) {
        return d != null ? d.toString() : null;
    }
}
