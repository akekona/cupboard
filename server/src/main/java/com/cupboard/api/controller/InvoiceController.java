package com.cupboard.api.controller;

import com.cupboard.api.dto.ApiResponse;
import com.cupboard.api.dto.invoice.*;
import com.cupboard.api.enums.InvoiceStatus;
import com.cupboard.api.service.InvoiceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/invoices")
public class InvoiceController {

    @Autowired private InvoiceService invoiceService;

    @GetMapping
    public ApiResponse<List<InvoiceSummaryResponse>> getAll(
            @RequestParam(required = false) Long clientId,
            @RequestParam(required = false) InvoiceStatus status) {
        return ApiResponse.ok(invoiceService.getAllInvoices(clientId, status));
    }

    @GetMapping("/stats")
    public ApiResponse<InvoiceStatsResponse> getStats() {
        return ApiResponse.ok(invoiceService.getInvoiceStats());
    }

    @GetMapping("/{id}")
    public ApiResponse<InvoiceResponse> getById(@PathVariable Long id) {
        return ApiResponse.ok(invoiceService.getInvoiceById(id));
    }

    @PutMapping("/{id}")
    public ApiResponse<InvoiceResponse> update(@PathVariable Long id,
                                               @RequestBody UpdateInvoiceRequest req) {
        return ApiResponse.ok(invoiceService.updateInvoice(id, req));
    }

    @PatchMapping("/{id}/finalize")
    public ApiResponse<InvoiceResponse> finalize(@PathVariable Long id) {
        return ApiResponse.ok(invoiceService.finalizeInvoice(id));
    }

    @PatchMapping("/{id}/send")
    public ApiResponse<InvoiceResponse> send(@PathVariable Long id) {
        return ApiResponse.ok(invoiceService.sendInvoice(id));
    }

    @PatchMapping("/{id}/overdue")
    public ApiResponse<InvoiceResponse> markOverdue(@PathVariable Long id) {
        return ApiResponse.ok(invoiceService.markOverdue(id));
    }

    @PatchMapping("/{id}/refund")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<InvoiceResponse> refund(@PathVariable Long id) {
        return ApiResponse.ok(invoiceService.processRefund(id));
    }
}
