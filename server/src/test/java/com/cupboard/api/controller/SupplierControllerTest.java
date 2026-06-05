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
class SupplierControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    // ── GET /api/suppliers ────────────────────────────────────────────────────

    @Test
    void getAll_asAdmin_returnsSeedSuppliers() throws Exception {
        String body = mockMvc.perform(get("/api/suppliers")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray())
                .andReturn().getResponse().getContentAsString();

        assertThat(objectMapper.readTree(body).get("data").size()).isEqualTo(4);
    }

    @Test
    void getAll_asStaff_returns403() throws Exception {
        mockMvc.perform(get("/api/suppliers")
                        .header("Authorization", "Bearer " + staffToken()))
                .andExpect(status().isForbidden());
    }

    @Test
    void getAll_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/suppliers"))
                .andExpect(status().isUnauthorized());
    }

    // ── GET /api/suppliers/{id} ───────────────────────────────────────────────

    @Test
    void getById_oahuRoasters_returnsWithProducts() throws Exception {
        String body = mockMvc.perform(get("/api/suppliers/1")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Oahu Roasters"))
                .andReturn().getResponse().getContentAsString();

        JsonNode products = objectMapper.readTree(body).get("data").get("products");
        assertThat(products.isArray()).isTrue();
        assertThat(products.size()).isGreaterThan(0);
        // Oahu Roasters supplies coffee products + espresso machine
        boolean hasCoffee = false;
        for (JsonNode p : products) {
            if (p.get("sku").asText().startsWith("COF-")) { hasCoffee = true; break; }
        }
        assertThat(hasCoffee).isTrue();
    }

    @Test
    void getById_unknownId_returns404() throws Exception {
        mockMvc.perform(get("/api/suppliers/99999")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").isString());
    }

    // ── POST /api/suppliers ───────────────────────────────────────────────────

    @Test
    void create_validRequest_returns201() throws Exception {
        Map<String, String> req = Map.of(
                "name", "Big Island Farms",
                "contactName", "K. Hilo",
                "contactEmail", "k@bigislandfarms.test",
                "contactPhone", "(808) 555-9999",
                "address", "100 Volcano Rd, Hilo, HI 96720"
        );

        mockMvc.perform(post("/api/suppliers")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Big Island Farms"))
                .andExpect(jsonPath("$.data.products").isArray());
    }

    @Test
    void create_missingName_returns400() throws Exception {
        mockMvc.perform(post("/api/suppliers")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    // ── PUT /api/suppliers/{id} ───────────────────────────────────────────────

    @Test
    void update_partialFields_updatesOnlyProvided() throws Exception {
        mockMvc.perform(put("/api/suppliers/1")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("contactPhone", "(808) 555-0199"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.contactPhone").value("(808) 555-0199"))
                .andExpect(jsonPath("$.data.name").value("Oahu Roasters")); // unchanged
    }

    @Test
    void update_unknownId_returns404() throws Exception {
        mockMvc.perform(put("/api/suppliers/99999")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("name", "X"))))
                .andExpect(status().isNotFound());
    }

    // ── DELETE /api/suppliers/{id} ────────────────────────────────────────────

    @Test
    void delete_softDeletesThenReturns404() throws Exception {
        // Create a supplier to delete
        String created = mockMvc.perform(post("/api/suppliers")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("name", "Temp Supplier"))))
                .andReturn().getResponse().getContentAsString();
        long newId = objectMapper.readTree(created).get("data").get("id").asLong();

        mockMvc.perform(delete("/api/suppliers/" + newId)
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/suppliers/" + newId)
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isNotFound());
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
