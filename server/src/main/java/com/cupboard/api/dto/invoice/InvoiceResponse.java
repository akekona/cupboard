package com.cupboard.api.dto.invoice;

import com.cupboard.api.enums.Currency;
import com.cupboard.api.enums.InvoiceStatus;
import com.cupboard.api.enums.OrderStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record InvoiceResponse(
        Long id,
        String invoiceNumber,
        OrderInfo order,
        ClientInfo client,
        Long totalAmount,
        Currency currency,
        InvoiceStatus status,
        LocalDate dueDate,
        String stripeInvoiceId,
        String stripeHostedUrl,
        LocalDateTime sentAt,
        LocalDateTime paidAt,
        String notes,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public record OrderInfo(Long id, OrderStatus status, Currency currency) {}
    public record ClientInfo(Long id, String name, String contactEmail) {}
}
