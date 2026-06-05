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

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ClientControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    // ── GET /api/clients ──────────────────────────────────────────────────────

    @Test
    void getAll_returnsSummaryListWithStats() throws Exception {
        String body = mockMvc.perform(get("/api/clients")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray())
                .andReturn().getResponse().getContentAsString();

        JsonNode data = objectMapper.readTree(body).get("data");
        assertThat(data.size()).isEqualTo(4);

        // Every summary has the expected fields from the view
        for (JsonNode c : data) {
            assertThat(c.has("orderCount")).isTrue();
            assertThat(c.has("totalSpend")).isTrue();
            assertThat(c.has("outstandingBalance")).isTrue();
        }
    }

    @Test
    void getAll_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/clients"))
                .andExpect(status().isUnauthorized());
    }

    // ── GET /api/clients/{id} ─────────────────────────────────────────────────

    @Test
    void getById_blueBottleKailua_returnsDetailWithRecentOrders() throws Exception {
        mockMvc.perform(get("/api/clients/1")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Blue Bottle Kailua"))
                .andExpect(jsonPath("$.data.accountStatus").value("ACTIVE"))
                .andExpect(jsonPath("$.data.recentOrders").isArray());

        String body = mockMvc.perform(get("/api/clients/1")
                        .header("Authorization", "Bearer " + adminToken()))
                .andReturn().getResponse().getContentAsString();
        JsonNode orders = objectMapper.readTree(body).get("data").get("recentOrders");
        assertThat(orders.size()).isGreaterThanOrEqualTo(1);

        // Each order summary has expected fields
        for (JsonNode o : orders) {
            assertThat(o.has("id")).isTrue();
            assertThat(o.has("status")).isTrue();
            assertThat(o.has("totalAmount")).isTrue();
            assertThat(o.get("totalAmount").asLong()).isGreaterThan(0);
        }
    }

    @Test
    void getById_stomptownHonolulu_isSuspended() throws Exception {
        mockMvc.perform(get("/api/clients/4")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accountStatus").value("SUSPENDED"));
    }

    @Test
    void getById_unknownId_returns404() throws Exception {
        mockMvc.perform(get("/api/clients/99999")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").isString());
    }

    // ── POST /api/clients ─────────────────────────────────────────────────────

    @Test
    void create_validRequest_returns201() throws Exception {
        Map<String, String> req = Map.of(
                "name", "Aloha Coffee Co.",
                "contactName", "L. Kahananui",
                "contactEmail", "l@alohacoffee.test",
                "contactPhone", "(808) 555-7777",
                "address", "200 Ala Wai Blvd, Honolulu, HI 96815"
        );

        mockMvc.perform(post("/api/clients")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Aloha Coffee Co."))
                .andExpect(jsonPath("$.data.accountStatus").value("ACTIVE"));
    }

    @Test
    void create_missingName_returns400() throws Exception {
        mockMvc.perform(post("/api/clients")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    // ── PUT /api/clients/{id} ─────────────────────────────────────────────────

    @Test
    void update_partialFields_updatesOnlyProvided() throws Exception {
        mockMvc.perform(put("/api/clients/1")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("contactEmail", "new@bluebottle.test"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.contactEmail").value("new@bluebottle.test"))
                .andExpect(jsonPath("$.data.name").value("Blue Bottle Kailua")); // unchanged
    }

    // ── PATCH /api/clients/{id}/suspend ──────────────────────────────────────

    @Test
    void suspend_asAdmin_returns204ThenStatusIsSuspended() throws Exception {
        // Create a fresh client so we don't permanently affect seed data
        String created = mockMvc.perform(post("/api/clients")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("name", "Suspend Test Client"))))
                .andReturn().getResponse().getContentAsString();
        long newId = objectMapper.readTree(created).get("data").get("id").asLong();

        mockMvc.perform(patch("/api/clients/" + newId + "/suspend")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/clients/" + newId)
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(jsonPath("$.data.accountStatus").value("SUSPENDED"));
    }

    @Test
    void suspend_asStaff_returns403() throws Exception {
        mockMvc.perform(patch("/api/clients/1/suspend")
                        .header("Authorization", "Bearer " + staffToken()))
                .andExpect(status().isForbidden());
    }

    // ── PATCH /api/clients/{id}/reactivate ────────────────────────────────────

    @Test
    void reactivate_suspendedClient_statusBecomesActive() throws Exception {
        // Stumptown (id=4) is already SUSPENDED in seed data
        mockMvc.perform(patch("/api/clients/4/reactivate")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/clients/4")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(jsonPath("$.data.accountStatus").value("ACTIVE"));
    }

    // ── DELETE /api/clients/{id} ──────────────────────────────────────────────

    @Test
    void delete_asAdmin_softDeletesThenReturns404() throws Exception {
        String created = mockMvc.perform(post("/api/clients")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("name", "Delete Test Client"))))
                .andReturn().getResponse().getContentAsString();
        long newId = objectMapper.readTree(created).get("data").get("id").asLong();

        mockMvc.perform(delete("/api/clients/" + newId)
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/clients/" + newId)
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isNotFound());
    }

    @Test
    void delete_asStaff_returns403() throws Exception {
        mockMvc.perform(delete("/api/clients/1")
                        .header("Authorization", "Bearer " + staffToken()))
                .andExpect(status().isForbidden());
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
                        .content(objectMapper.writeValueAsString(Map.of("email", email, "password", password))))
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response).get("token").asText();
    }
}
