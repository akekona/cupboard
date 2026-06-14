package com.cupboard.api.dto.debug;

public record InvoiceDebugInfo(
        Long id,
        String invoiceNumber,
        String status,
        String dueDate,
        String sentAt,
        String paidAt,
        long totalAmount,
        String currency,
        String stripeInvoiceId,
        String stripeInvoiceUrl
) {}
