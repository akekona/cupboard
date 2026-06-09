package com.cupboard.api.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class OrderControllerTest {

    @Autowired private MockMvc mockMvc;

    private final ObjectMapper om = new ObjectMapper();

    // ── Create ────────────────────────────────────────────────────────────────

    @Test
    void createOrder_validRequest_returns201WithDraftOrder() throws Exception {
        mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(orderRequest(1L, List.of(item(2L, 5))))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("DRAFT"))
                .andExpect(jsonPath("$.data.items").isArray())
                .andExpect(jsonPath("$.data.subtotal").isNumber())
                .andExpect(jsonPath("$.data.invoice").isEmpty());
    }

    @Test
    void createOrder_unknownClient_returns404() throws Exception {
        mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(orderRequest(9999L, List.of(item(2L, 1))))))
                .andExpect(status().isNotFound());
    }

    @Test
    void createOrder_suspendedClient_returns422() throws Exception {
        // client 4 = Stumptown Honolulu, SUSPENDED
        mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(orderRequest(4L, List.of(item(2L, 1))))))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void createOrder_emptyItems_returns400() throws Exception {
        mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(orderRequest(1L, List.of()))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createOrder_unknownProduct_returns404() throws Exception {
        mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(orderRequest(1L, List.of(item(9999L, 1))))))
                .andExpect(status().isNotFound());
    }

    @Test
    void createOrder_staffUser_returns201() throws Exception {
        mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + staffToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(orderRequest(1L, List.of(item(2L, 2))))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.status").value("DRAFT"));
    }

    // ── Get all (paginated) ───────────────────────────────────────────────────

    @Test
    void getAllOrders_noFilters_returnsPagedResponse() throws Exception {
        String body = mockMvc.perform(get("/api/orders")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content").isArray())
                .andExpect(jsonPath("$.data.totalElements").isNumber())
                .andReturn().getResponse().getContentAsString();

        assertThat(om.readTree(body).get("data").get("totalElements").asLong()).isGreaterThanOrEqualTo(5);
    }

    @Test
    void getAllOrders_filterByStatus_returnsMatchingOrders() throws Exception {
        String body = mockMvc.perform(get("/api/orders?status=FULFILLED")
                        .header("Authorization", "Bearer " + adminToken()))
                .andReturn().getResponse().getContentAsString();

        JsonNode content = om.readTree(body).get("data").get("content");
        assertThat(content.size()).isGreaterThanOrEqualTo(1);
        for (JsonNode o : content) {
            assertThat(o.get("status").asText()).isEqualTo("FULFILLED");
        }
    }

    @Test
    void getAllOrders_filterByClientId_returnsOnlyThatClientsOrders() throws Exception {
        String body = mockMvc.perform(get("/api/orders?clientId=1")
                        .header("Authorization", "Bearer " + adminToken()))
                .andReturn().getResponse().getContentAsString();

        JsonNode content = om.readTree(body).get("data").get("content");
        assertThat(content.size()).isGreaterThanOrEqualTo(1);
        for (JsonNode o : content) {
            assertThat(o.get("clientId").asLong()).isEqualTo(1L);
        }
    }

    @Test
    void getAllOrders_searchByClientName_returnsMatchingOrders() throws Exception {
        // "Blue Bottle Kailua" is client 1 — has 2 seed orders
        String body = mockMvc.perform(get("/api/orders?search=blue")
                        .header("Authorization", "Bearer " + adminToken()))
                .andReturn().getResponse().getContentAsString();

        JsonNode content = om.readTree(body).get("data").get("content");
        assertThat(content.size()).isGreaterThanOrEqualTo(2);
        for (JsonNode o : content) {
            assertThat(o.get("clientName").asText().toLowerCase()).contains("blue");
        }
    }

    @Test
    void getAllOrders_pagination_page0Size2_returnsCorrectMetadata() throws Exception {
        String body = mockMvc.perform(get("/api/orders?page=0&size=2")
                        .header("Authorization", "Bearer " + adminToken()))
                .andReturn().getResponse().getContentAsString();

        JsonNode data = om.readTree(body).get("data");
        assertThat(data.get("content").size()).isEqualTo(2);
        assertThat(data.get("currentPage").asInt()).isEqualTo(0);
        assertThat(data.get("totalPages").asInt()).isGreaterThanOrEqualTo(3);
        assertThat(data.get("first").asBoolean()).isTrue();
        assertThat(data.get("last").asBoolean()).isFalse();
    }

    @Test
    void getAllOrders_combinedFilters_returnsIntersection() throws Exception {
        // client 1 + FULFILLED → order 1 only
        String body = mockMvc.perform(get("/api/orders?clientId=1&status=FULFILLED")
                        .header("Authorization", "Bearer " + adminToken()))
                .andReturn().getResponse().getContentAsString();

        JsonNode content = om.readTree(body).get("data").get("content");
        assertThat(content.size()).isGreaterThanOrEqualTo(1);
        for (JsonNode o : content) {
            assertThat(o.get("clientId").asLong()).isEqualTo(1L);
            assertThat(o.get("status").asText()).isEqualTo("FULFILLED");
        }
    }

    // ── Get by id ─────────────────────────────────────────────────────────────

    @Test
    void getOrderById_existingOrder_returnsFullResponse() throws Exception {
        mockMvc.perform(get("/api/orders/1")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(1))
                .andExpect(jsonPath("$.data.client").isMap())
                .andExpect(jsonPath("$.data.items").isArray())
                .andExpect(jsonPath("$.data.subtotal").isNumber());
    }

    @Test
    void getOrderById_unknownId_returns404() throws Exception {
        mockMvc.perform(get("/api/orders/99999")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }

    // ── Update ────────────────────────────────────────────────────────────────

    @Test
    void updateOrder_draftOrder_returnsUpdated() throws Exception {
        Long orderId = createDraftOrder();

        Map<String, Object> update = Map.of("notes", "Updated notes");
        mockMvc.perform(put("/api/orders/" + orderId)
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.notes").value("Updated notes"));
    }

    @Test
    void updateOrder_confirmedOrder_returns422() throws Exception {
        // Order 2 is SHIPPED, order 3 is CONFIRMED — both are non-DRAFT
        mockMvc.perform(put("/api/orders/3")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(Map.of("notes", "Should fail"))))
                .andExpect(status().isUnprocessableEntity());
    }

    // ── Confirm ───────────────────────────────────────────────────────────────

    @Test
    void confirmOrder_sufficientStock_returnsConfirmedWithInvoice() throws Exception {
        // Colombia Blend (id=2) has 120 units, requesting 5
        Long orderId = createDraftOrder(1L, List.of(item(2L, 5)));

        String body = mockMvc.perform(patch("/api/orders/" + orderId + "/confirm")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("CONFIRMED"))
                .andReturn().getResponse().getContentAsString();

        // Invoice auto-created
        JsonNode invoice = om.readTree(body).get("data").get("invoice");
        assertThat(invoice.isNull()).isFalse();
        assertThat(invoice.get("status").asText()).isEqualTo("DRAFT");
        assertThat(invoice.get("invoiceNumber").asText()).startsWith("INV-");
    }

    @Test
    void confirmOrder_insufficientStock_returns422WithMessage() throws Exception {
        // Ethiopian Single Origin (id=1) has 14 units, requesting 20
        Long orderId = createDraftOrder(1L, List.of(item(1L, 20)));

        mockMvc.perform(patch("/api/orders/" + orderId + "/confirm")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Insufficient stock")))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Ethiopian")));
    }

    @Test
    void confirmOrder_alreadyConfirmed_returns422() throws Exception {
        // Order 3 is already CONFIRMED in seed data
        mockMvc.perform(patch("/api/orders/3/confirm")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isUnprocessableEntity());
    }

    @Test
    void confirmOrder_staffUser_returns200() throws Exception {
        Long orderId = createDraftOrder(1L, List.of(item(2L, 3)));
        mockMvc.perform(patch("/api/orders/" + orderId + "/confirm")
                        .header("Authorization", "Bearer " + staffToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("CONFIRMED"));
    }

    // ── Ship ──────────────────────────────────────────────────────────────────

    @Test
    void shipOrder_fromConfirmed_returnsShipped() throws Exception {
        Long orderId = createAndConfirmOrder();

        mockMvc.perform(patch("/api/orders/" + orderId + "/ship")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("SHIPPED"));
    }

    @Test
    void shipOrder_fromDraft_returns422() throws Exception {
        Long orderId = createDraftOrder();
        mockMvc.perform(patch("/api/orders/" + orderId + "/ship")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isUnprocessableEntity());
    }

    // ── Fulfill ───────────────────────────────────────────────────────────────

    @Test
    void fulfillOrder_fromShipped_returnsFulfilled() throws Exception {
        Long orderId = createAndConfirmOrder();
        mockMvc.perform(patch("/api/orders/" + orderId + "/ship")
                        .header("Authorization", "Bearer " + adminToken()));

        mockMvc.perform(patch("/api/orders/" + orderId + "/fulfill")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("FULFILLED"));
    }

    @Test
    void fulfillOrder_fromConfirmed_returns422() throws Exception {
        Long orderId = createAndConfirmOrder();
        mockMvc.perform(patch("/api/orders/" + orderId + "/fulfill")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isUnprocessableEntity());
    }

    // ── Delete ────────────────────────────────────────────────────────────────

    @Test
    void deleteOrder_draftOrder_returns204() throws Exception {
        Long orderId = createDraftOrder();
        mockMvc.perform(delete("/api/orders/" + orderId)
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/orders/" + orderId)
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isNotFound());
    }

    @Test
    void deleteOrder_confirmedOrder_returns422() throws Exception {
        // Order 3 is CONFIRMED
        mockMvc.perform(delete("/api/orders/3")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isUnprocessableEntity());
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Long createDraftOrder() throws Exception {
        return createDraftOrder(1L, List.of(item(2L, 5)));
    }

    private Long createDraftOrder(Long clientId, java.util.List<Map<String, Object>> items) throws Exception {
        String body = mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(orderRequest(clientId, items))))
                .andReturn().getResponse().getContentAsString();
        return om.readTree(body).get("data").get("id").asLong();
    }

    private Long createAndConfirmOrder() throws Exception {
        Long id = createDraftOrder(1L, List.of(item(2L, 3)));
        mockMvc.perform(patch("/api/orders/" + id + "/confirm")
                .header("Authorization", "Bearer " + adminToken()));
        return id;
    }

    private Map<String, Object> orderRequest(Long clientId, java.util.List<Map<String, Object>> items) {
        return Map.of("clientId", clientId, "currency", "USD", "items", items);
    }

    private Map<String, Object> item(Long productId, int quantity) {
        return Map.of("productId", productId, "quantity", quantity);
    }

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
