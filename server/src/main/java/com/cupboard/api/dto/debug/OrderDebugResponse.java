package com.cupboard.api.dto.debug;

import java.util.List;

public record OrderDebugResponse(
        OrderDebugInfo order,
        InvoiceDebugInfo invoice,
        PaymentDebugInfo payment,
        List<String> flags
) {}
