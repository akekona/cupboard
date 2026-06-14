package com.cupboard.api.dto.order;

import com.cupboard.api.enums.Currency;
import com.cupboard.api.enums.InvoiceStatus;
import com.cupboard.api.enums.OrderStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record OrderResponse(
        Long id,
        String orderNumber,
        ClientInfo client,
        UserInfo createdBy,
        OrderStatus status,
        Currency currency,
        LocalDate needBy,
        String notes,
        List<OrderItemResponse> items,
        Long subtotal,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        InvoiceInfo invoice
) {
    public record ClientInfo(Long id, String name, String contactEmail) {}
    public record UserInfo(Long id, String firstName, String lastName) {}
    public record InvoiceInfo(Long id, String invoiceNumber, InvoiceStatus status, Long totalAmount) {}
}
