package com.cupboard.api.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.http.MediaType.APPLICATION_JSON;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class PaymentControllerTest {

    @Autowired private MockMvc mockMvc;

    private final ObjectMapper om = new ObjectMapper();

    // ── Search ────────────────────────────────────────────────────────────────

    @Test
    void getPayments_searchByStripePaymentId_returnsMatchingPayment() throws Exception {
        // seed: pi_test_001 belongs to invoice 1 (Blue Bottle Kailua)
        String body = mockMvc.perform(get("/api/payments?search=pi_test_001")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode content = om.readTree(body).get("data").get("content");
        assertThat(content.size()).isGreaterThanOrEqualTo(1);
        boolean found = false;
        for (JsonNode p : content) {
            if ("pi_test_001".equals(p.get("stripePaymentId").asText())) found = true;
        }
        assertThat(found).isTrue();
    }

    @Test
    void getPayments_searchByClientName_returnsMatchingPayments() throws Exception {
        // "Blue Bottle Kailua" → payment on INV-0001
        String body = mockMvc.perform(get("/api/payments?search=blue")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode content = om.readTree(body).get("data").get("content");
        assertThat(content.size()).isGreaterThanOrEqualTo(1);
        for (JsonNode p : content) {
            assertThat(p.get("clientName").asText().toLowerCase()).contains("blue");
        }
    }

    @Test
    void getPayments_searchByInvoiceNumber_returnsMatchingPayment() throws Exception {
        String body = mockMvc.perform(get("/api/payments?search=INV-0001")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode content = om.readTree(body).get("data").get("content");
        assertThat(content.size()).isGreaterThanOrEqualTo(1);
        for (JsonNode p : content) {
            assertThat(p.get("invoiceNumber").asText()).contains("0001");
        }
    }

    // ── Status filter ─────────────────────────────────────────────────────────

    @Test
    void getPayments_filterByStatusSucceeded_returnsOnlySucceeded() throws Exception {
        String body = mockMvc.perform(get("/api/payments?status=SUCCEEDED")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode data = om.readTree(body).get("data");
        JsonNode content = data.get("content");
        assertThat(data.get("totalElements").asLong()).isGreaterThanOrEqualTo(2);
        for (JsonNode p : content) {
            assertThat(p.get("status").asText()).isEqualTo("SUCCEEDED");
        }
    }

    @Test
    void getPayments_filterByStatusRefunded_returnsEmptyForSeedData() throws Exception {
        String body = mockMvc.perform(get("/api/payments?status=REFUNDED")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode data = om.readTree(body).get("data");
        assertThat(data.get("totalElements").asLong()).isEqualTo(0);
    }

    // ── Payment method filter ─────────────────────────────────────────────────

    @Test
    void getPayments_filterByPaymentMethodStripeCard_returnsMatchingPayments() throws Exception {
        String body = mockMvc.perform(get("/api/payments?paymentMethod=STRIPE_CARD")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode content = om.readTree(body).get("data").get("content");
        assertThat(content.size()).isGreaterThanOrEqualTo(2);
        for (JsonNode p : content) {
            assertThat(p.get("paymentMethod").asText()).isEqualTo("STRIPE_CARD");
        }
    }

    // ── Combined filter ───────────────────────────────────────────────────────

    @Test
    void getPayments_combinedStatusAndPaymentMethod_returnsIntersection() throws Exception {
        String body = mockMvc.perform(get("/api/payments?status=SUCCEEDED&paymentMethod=STRIPE_CARD")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode content = om.readTree(body).get("data").get("content");
        assertThat(content.size()).isGreaterThanOrEqualTo(2);
        for (JsonNode p : content) {
            assertThat(p.get("status").asText()).isEqualTo("SUCCEEDED");
            assertThat(p.get("paymentMethod").asText()).isEqualTo("STRIPE_CARD");
        }
    }

    // ── Pagination ────────────────────────────────────────────────────────────

    @Test
    void getPayments_pagination_page0Size1_returnsCorrectMetadata() throws Exception {
        String body = mockMvc.perform(get("/api/payments?page=0&size=1")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode data = om.readTree(body).get("data");
        assertThat(data.get("content").size()).isEqualTo(1);
        assertThat(data.get("currentPage").asInt()).isEqualTo(0);
        assertThat(data.get("totalPages").asInt()).isGreaterThanOrEqualTo(2);
        assertThat(data.get("first").asBoolean()).isTrue();
        assertThat(data.get("last").asBoolean()).isFalse();
    }

    // ── Stats ─────────────────────────────────────────────────────────────────

    @Test
    void getPaymentStats_returnsStatsUnchanged() throws Exception {
        mockMvc.perform(get("/api/payments/stats")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.collectedThisMonth").isNumber())
                .andExpect(jsonPath("$.data.pending").isNumber())
                .andExpect(jsonPath("$.data.refunded").isNumber());
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private String adminToken() throws Exception {
        String response = mockMvc.perform(post("/api/auth/login")
                        .contentType(APPLICATION_JSON)
                        .content(om.writeValueAsString(Map.of("email", "ashley@cupboard.test", "password", "password123"))))
                .andReturn().getResponse().getContentAsString();
        return om.readTree(response).get("token").asText();
    }
}
