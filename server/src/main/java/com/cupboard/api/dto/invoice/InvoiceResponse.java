package com.cupboard.api.dto.invoice;

import com.cupboard.api.enums.Currency;
import com.cupboard.api.enums.InvoiceStatus;
import com.cupboard.api.enums.OrderStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record InvoiceResponse(
        Long id,
        String invoiceNumber,
        OrderInfo order,
        ClientInfo client,
        Long totalAmount,
        Currency currency,
        InvoiceStatus status,
        List<InvoiceLineItemResponse> lineItems,
        LocalDate dueDate,
        String stripeInvoiceId,
        String stripeHostedUrl,
        LocalDateTime sentAt,
        LocalDateTime paidAt,
        String notes,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public record OrderInfo(Long id, String orderNumber, OrderStatus status, Currency currency, LocalDateTime createdAt) {}
    public record ClientInfo(Long id, String name, String contactEmail) {}
}
