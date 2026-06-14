package com.cupboard.api.dto.invoice;

import com.cupboard.api.enums.Currency;

public record InvoiceLineItemResponse(
        String productName,
        String sku,
        int quantity,
        long unitPrice,
        Currency currency,
        long lineTotal
) {}
