package com.cupboard.api.dto.payment;

import com.cupboard.api.enums.Currency;
import com.cupboard.api.enums.PaymentMethod;
import com.cupboard.api.enums.PaymentStatus;

import java.time.LocalDateTime;

public record PaymentResponse(
        Long id,
        Long invoiceId,
        String invoiceNumber,
        Long clientId,
        String clientName,
        String stripeInvoiceId,
        String stripePaymentId,
        Long amount,
        Currency currency,
        PaymentMethod paymentMethod,
        PaymentStatus status,
        LocalDateTime createdAt
) {}
