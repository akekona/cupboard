package com.cupboard.api.dto.invoice;

import com.cupboard.api.enums.Currency;
import com.cupboard.api.enums.InvoiceStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record InvoiceSummaryResponse(
        Long id,
        String invoiceNumber,
        Long clientId,
        String clientName,
        Long totalAmount,
        Currency currency,
        InvoiceStatus status,
        LocalDate dueDate,
        LocalDateTime sentAt,
        LocalDateTime paidAt,
        Long orderId
) {}
