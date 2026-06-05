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
class ProductControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    // ── GET /api/products ─────────────────────────────────────────────────────

    @Test
    void getAll_returnsWrappedList() throws Exception {
        mockMvc.perform(get("/api/products")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());

        String body = mockMvc.perform(get("/api/products")
                        .header("Authorization", "Bearer " + adminToken()))
                .andReturn().getResponse().getContentAsString();
        int count = objectMapper.readTree(body).get("data").size();
        assertThat(count).isGreaterThanOrEqualTo(12);
    }

    @Test
    void getAll_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/products"))
                .andExpect(status().isUnauthorized());
    }

    // ── GET /api/products/low-stock ───────────────────────────────────────────

    @Test
    void getLowStock_returnsLowStockProductsOnly() throws Exception {
        String body = mockMvc.perform(get("/api/products/low-stock")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andReturn().getResponse().getContentAsString();

        JsonNode data = objectMapper.readTree(body).get("data");
        assertThat(data.size()).isGreaterThanOrEqualTo(2);
        // every returned product must have stockQuantity <= reorderThreshold
        for (JsonNode p : data) {
            assertThat(p.get("stockQuantity").asInt())
                    .isLessThanOrEqualTo(p.get("reorderThreshold").asInt());
            assertThat(p.get("isLowStock").asBoolean()).isTrue();
        }
    }

    @Test
    void getLowStock_includesEthiopianAndEspressoMachine() throws Exception {
        String body = mockMvc.perform(get("/api/products/low-stock")
                        .header("Authorization", "Bearer " + adminToken()))
                .andReturn().getResponse().getContentAsString();

        JsonNode data = objectMapper.readTree(body).get("data");
        boolean hasEthiopian = false, hasEspresso = false;
        for (JsonNode p : data) {
            String name = p.get("name").asText();
            if (name.contains("Ethiopian")) hasEthiopian = true;
            if (name.contains("Espresso")) hasEspresso = true;
        }
        assertThat(hasEthiopian).isTrue();
        assertThat(hasEspresso).isTrue();
    }

    // ── GET /api/products/{id} ────────────────────────────────────────────────

    @Test
    void getById_existingProduct_returnsProductWithSuppliers() throws Exception {
        mockMvc.perform(get("/api/products/1")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(1))
                .andExpect(jsonPath("$.data.category").value("COFFEE"))
                .andExpect(jsonPath("$.data.suppliers").isArray());
    }

    @Test
    void getById_colombiaBlend_hasTwoSuppliers() throws Exception {
        String body = mockMvc.perform(get("/api/products/2")
                        .header("Authorization", "Bearer " + adminToken()))
                .andReturn().getResponse().getContentAsString();

        JsonNode suppliers = objectMapper.readTree(body).get("data").get("suppliers");
        assertThat(suppliers.size()).isEqualTo(2);
    }

    @Test
    void getById_unknownId_returns404WithMessage() throws Exception {
        mockMvc.perform(get("/api/products/99999")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").isString());
    }

    // ── POST /api/products ────────────────────────────────────────────────────

    @Test
    void create_asAdmin_returns201WithCreatedProduct() throws Exception {
        Map<String, Object> req = Map.of(
                "sku", "TEST-SKU-001",
                "name", "Test Coffee Blend",
                "category", "COFFEE",
                "unitPrice", 2500,
                "unit", "bag",
                "stockQuantity", 100,
                "reorderThreshold", 20
        );

        mockMvc.perform(post("/api/products")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.sku").value("TEST-SKU-001"))
                .andExpect(jsonPath("$.data.name").value("Test Coffee Blend"))
                .andExpect(jsonPath("$.data.isLowStock").value(false));
    }

    @Test
    void create_asStaff_returns403() throws Exception {
        Map<String, Object> req = Map.of(
                "sku", "TEST-SKU-002",
                "name", "Blocked Product",
                "category", "COFFEE",
                "unitPrice", 1000,
                "unit", "bag"
        );

        mockMvc.perform(post("/api/products")
                        .header("Authorization", "Bearer " + staffToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());
    }

    @Test
    void create_missingRequiredFields_returns400() throws Exception {
        mockMvc.perform(post("/api/products")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    // ── PUT /api/products/{id} ────────────────────────────────────────────────

    @Test
    void update_asAdmin_returnsUpdatedProduct() throws Exception {
        Map<String, Object> req = Map.of("name", "Ethiopian Single Origin 1kg (Updated)");

        mockMvc.perform(put("/api/products/1")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Ethiopian Single Origin 1kg (Updated)"));
    }

    @Test
    void update_unknownId_returns404() throws Exception {
        mockMvc.perform(put("/api/products/99999")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("name", "X"))))
                .andExpect(status().isNotFound());
    }

    // ── DELETE /api/products/{id} ─────────────────────────────────────────────

    @Test
    void delete_asAdmin_softDeletesThenReturns404() throws Exception {
        // Create a product to delete so we don't touch seed data permanently
        Map<String, Object> createReq = Map.of(
                "sku", "DEL-TEST-001", "name", "To Delete", "category", "CLEANING",
                "unitPrice", 500, "unit", "case"
        );
        String created = mockMvc.perform(post("/api/products")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andReturn().getResponse().getContentAsString();
        long newId = objectMapper.readTree(created).get("data").get("id").asLong();

        mockMvc.perform(delete("/api/products/" + newId)
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/products/" + newId)
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isNotFound());
    }

    @Test
    void delete_asStaff_returns403() throws Exception {
        mockMvc.perform(delete("/api/products/1")
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
