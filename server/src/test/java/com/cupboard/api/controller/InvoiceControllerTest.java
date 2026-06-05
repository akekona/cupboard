package com.cupboard.api.controller;

import com.cupboard.api.entity.Invoice;
import com.cupboard.api.entity.Payment;
import com.cupboard.api.enums.InvoiceStatus;
import com.cupboard.api.enums.PaymentMethod;
import com.cupboard.api.enums.PaymentStatus;
import com.cupboard.api.repository.InvoiceRepository;
import com.cupboard.api.repository.PaymentRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class InvoiceControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private InvoiceRepository invoiceRepository;
    @Autowired private PaymentRepository paymentRepository;

    private final ObjectMapper om = new ObjectMapper().findAndRegisterModules();

    // ── List ──────────────────────────────────────────────────────────────────

    @Test
    void getAllInvoices_noFilters_returnsAll() throws Exception {
        String body = mockMvc.perform(get("/api/invoices")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andReturn().getResponse().getContentAsString();

        assertThat(om.readTree(body).get("data").size()).isGreaterThanOrEqualTo(4);
    }

    @Test
    void getAllInvoices_filterByStatus_returnsMatchingOnly() throws Exception {
        String body = mockMvc.perform(get("/api/invoices?status=PAID")
                        .header("Authorization", "Bearer " + adminToken()))
                .andReturn().getResponse().getContentAsString();

        om.readTree(body).get("data").forEach(node ->
                assertThat(node.get("status").asText()).isEqualTo("PAID"));
    }

    @Test
    void getAllInvoices_filterByClient_returnsClientInvoices() throws Exception {
        String body = mockMvc.perform(get("/api/invoices?clientId=1")
                        .header("Authorization", "Bearer " + adminToken()))
                .andReturn().getResponse().getContentAsString();

        om.readTree(body).get("data").forEach(node ->
                assertThat(node.get("clientId").asLong()).isEqualTo(1L));
    }

    // ── Get by id ─────────────────────────────────────────────────────────────

    @Test
    void getInvoiceById_existing_returnsFullResponse() throws Exception {
        mockMvc.perform(get("/api/invoices/1")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(1))
                .andExpect(jsonPath("$.data.invoiceNumber").value("INV-0001"))
                .andExpect(jsonPath("$.data.order").isMap())
                .andExpect(jsonPath("$.data.client").isMap())
                .andExpect(jsonPath("$.data.totalAmount").isNumber());
    }

    @Test
    void getInvoiceById_unknown_returns404() throws Exception {
        mockMvc.perform(get("/api/invoices/99999")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }

    // ── Finalize ──────────────────────────────────────────────────────────────

    @Test
    void finalizeInvoice_fromDraft_returnsFinalized() throws Exception {
        // INV-0001 is PAID but we need a DRAFT. Create one by confirming a new order.
        // Use invoice id=3 which is FINALIZED... need a real DRAFT.
        // Directly update an invoice to DRAFT for this test.
        Invoice inv = invoiceRepository.findById(1L).orElseThrow();
        inv.setStatus(InvoiceStatus.DRAFT);
        invoiceRepository.save(inv);

        mockMvc.perform(patch("/api/invoices/1/finalize")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("FINALIZED"));
    }

    @Test
    void finalizeInvoice_fromSent_returns422() throws Exception {
        // INV-0002 is SENT — cannot finalize
        mockMvc.perform(patch("/api/invoices/2/finalize")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.success").value(false));
    }

    // ── Send ──────────────────────────────────────────────────────────────────

    @Test
    void sendInvoice_missingClientEmail_returns422() throws Exception {
        // Set client email to null on invoice 3 (FINALIZED), then try to send
        Invoice inv = invoiceRepository.findById(3L).orElseThrow();
        inv.getClient().setContactEmail(null);

        mockMvc.perform(patch("/api/invoices/3/send")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.message").value(
                        org.hamcrest.Matchers.containsString("contact email")));
    }

    // ── Mark overdue ──────────────────────────────────────────────────────────

    @Test
    void markOverdue_fromSentWithPastDueDate_returnsOverdue() throws Exception {
        Invoice inv = invoiceRepository.findById(2L).orElseThrow();
        inv.setDueDate(LocalDate.now().minusDays(1));
        invoiceRepository.save(inv);

        mockMvc.perform(patch("/api/invoices/2/overdue")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("OVERDUE"));
    }

    @Test
    void markOverdue_fromDraft_returns422() throws Exception {
        // Re-use invoice 1 set back to DRAFT
        Invoice inv = invoiceRepository.findById(1L).orElseThrow();
        inv.setStatus(InvoiceStatus.DRAFT);
        invoiceRepository.save(inv);

        mockMvc.perform(patch("/api/invoices/1/overdue")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isUnprocessableEntity());
    }

    // ── Refund ────────────────────────────────────────────────────────────────

    @Test
    void refundInvoice_asAdmin_withNoStripeId_succeeds() throws Exception {
        // Set up a PAID invoice whose payment has no stripePaymentId (avoids real Stripe call)
        Invoice inv = invoiceRepository.findById(1L).orElseThrow();
        inv.setStatus(InvoiceStatus.PAID);
        invoiceRepository.save(inv);

        // Clear existing payments for invoice 1 and create one without a stripe payment id
        paymentRepository.findAllByInvoiceId(1L).forEach(paymentRepository::delete);
        Payment p = new Payment();
        p.setInvoice(inv);
        p.setAmount(inv.getTotalAmount());
        p.setCurrency(inv.getCurrency());
        p.setPaymentMethod(PaymentMethod.CHECK);
        p.setStatus(PaymentStatus.SUCCEEDED);
        p.setCreatedAt(LocalDateTime.now());
        paymentRepository.save(p);

        mockMvc.perform(patch("/api/invoices/1/refund")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("REFUNDED"));
    }

    @Test
    void refundInvoice_asStaff_returns403() throws Exception {
        // INV-0001 is PAID — staff cannot refund
        mockMvc.perform(patch("/api/invoices/1/refund")
                        .header("Authorization", "Bearer " + staffToken()))
                .andExpect(status().isForbidden());
    }

    // ── Stats ─────────────────────────────────────────────────────────────────

    @Test
    void getStats_returnsNumericTotals() throws Exception {
        mockMvc.perform(get("/api/invoices/stats")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalOutstanding").isNumber())
                .andExpect(jsonPath("$.data.totalOverdue").isNumber())
                .andExpect(jsonPath("$.data.totalPaidThisMonth").isNumber())
                .andExpect(jsonPath("$.data.overdueCount").isNumber())
                .andExpect(jsonPath("$.data.outstandingCount").isNumber());
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private String adminToken() throws Exception {
        return loginAndGetToken("ashley@cupboard.test", "password123");
    }

    private String staffToken() throws Exception {
        return loginAndGetToken("kai@cupboard.test", "password123");
    }

    private String loginAndGetToken(String email, String password) throws Exception {
        String response = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(Map.of("email", email, "password", password))))
                .andReturn().getResponse().getContentAsString();
        return om.readTree(response).get("token").asText();
    }
}
