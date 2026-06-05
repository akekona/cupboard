package com.cupboard.api.dto.invoice;

import java.time.LocalDate;

public record UpdateInvoiceRequest(LocalDate dueDate, String notes) {}
