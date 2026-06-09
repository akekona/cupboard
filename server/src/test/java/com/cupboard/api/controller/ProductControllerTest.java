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

    // ── GET /api/products (paginated) ─────────────────────────────────────────

    @Test
    void getAll_returnsPagedResponse() throws Exception {
        String body = mockMvc.perform(get("/api/products")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content").isArray())
                .andExpect(jsonPath("$.data.totalElements").isNumber())
                .andExpect(jsonPath("$.data.totalPages").isNumber())
                .andExpect(jsonPath("$.data.currentPage").value(0))
                .andReturn().getResponse().getContentAsString();

        JsonNode data = objectMapper.readTree(body).get("data");
        assertThat(data.get("totalElements").asLong()).isGreaterThanOrEqualTo(12);
    }

    @Test
    void getAll_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/products"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getAll_defaultPageSize50_returnsAllSeedProducts() throws Exception {
        String body = mockMvc.perform(get("/api/products")
                        .header("Authorization", "Bearer " + adminToken()))
                .andReturn().getResponse().getContentAsString();

        JsonNode data = objectMapper.readTree(body).get("data");
        assertThat(data.get("content").size()).isGreaterThanOrEqualTo(12);
        assertThat(data.get("first").asBoolean()).isTrue();
    }

    // ── Search ────────────────────────────────────────────────────────────────

    @Test
    void search_byExactName_returnsMatchingProduct() throws Exception {
        String body = mockMvc.perform(get("/api/products?search=Ethiopian")
                        .header("Authorization", "Bearer " + adminToken()))
                .andReturn().getResponse().getContentAsString();

        JsonNode content = objectMapper.readTree(body).get("data").get("content");
        assertThat(content.size()).isEqualTo(1);
        assertThat(content.get(0).get("name").asText()).contains("Ethiopian");
    }

    @Test
    void search_byPartialName_returnsAllMatches() throws Exception {
        // "milk" matches "Oat Milk" and "Whole Milk"
        String body = mockMvc.perform(get("/api/products?search=milk")
                        .header("Authorization", "Bearer " + adminToken()))
                .andReturn().getResponse().getContentAsString();

        JsonNode content = objectMapper.readTree(body).get("data").get("content");
        assertThat(content.size()).isEqualTo(2);
        for (JsonNode p : content) {
            assertThat(p.get("name").asText().toLowerCase()).contains("milk");
        }
    }

    @Test
    void search_bySku_returnsMatchingProduct() throws Exception {
        String body = mockMvc.perform(get("/api/products?search=COF-ETH-1KG")
                        .header("Authorization", "Bearer " + adminToken()))
                .andReturn().getResponse().getContentAsString();

        JsonNode content = objectMapper.readTree(body).get("data").get("content");
        assertThat(content.size()).isEqualTo(1);
        assertThat(content.get(0).get("sku").asText()).isEqualTo("COF-ETH-1KG");
    }

    // ── Category filter ───────────────────────────────────────────────────────

    @Test
    void filterByCategory_singleCategory_returnsOnlyThatCategory() throws Exception {
        String body = mockMvc.perform(get("/api/products?category=COFFEE")
                        .header("Authorization", "Bearer " + adminToken()))
                .andReturn().getResponse().getContentAsString();

        JsonNode content = objectMapper.readTree(body).get("data").get("content");
        assertThat(content.size()).isEqualTo(2);
        for (JsonNode p : content) {
            assertThat(p.get("category").asText()).isEqualTo("COFFEE");
        }
    }

    @Test
    void filterByCategory_multipleCategories_returnsAllMatchingCategories() throws Exception {
        String body = mockMvc.perform(get("/api/products?category=COFFEE,DAIRY")
                        .header("Authorization", "Bearer " + adminToken()))
                .andReturn().getResponse().getContentAsString();

        JsonNode content = objectMapper.readTree(body).get("data").get("content");
        assertThat(content.size()).isEqualTo(4); // 2 coffee + 2 dairy
        for (JsonNode p : content) {
            assertThat(p.get("category").asText()).isIn("COFFEE", "DAIRY");
        }
    }

    // ── Status filter ─────────────────────────────────────────────────────────

    @Test
    void filterByStatus_lowStock_returnsLowStockProducts() throws Exception {
        // COF-ETH-1KG: qty=14, threshold=50 → LOW_STOCK
        String body = mockMvc.perform(get("/api/products?status=LOW_STOCK")
                        .header("Authorization", "Bearer " + adminToken()))
                .andReturn().getResponse().getContentAsString();

        JsonNode content = objectMapper.readTree(body).get("data").get("content");
        assertThat(content.size()).isGreaterThanOrEqualTo(1);
        for (JsonNode p : content) {
            int qty = p.get("stockQuantity").asInt();
            int threshold = p.get("reorderThreshold").asInt();
            assertThat(qty).isGreaterThan(0);
            assertThat(qty).isLessThanOrEqualTo(threshold);
        }
    }

    @Test
    void filterByStatus_outOfStock_returnsOutOfStockProducts() throws Exception {
        // EQUIP-ESP-BDB: qty=0 → OUT_OF_STOCK
        String body = mockMvc.perform(get("/api/products?status=OUT_OF_STOCK")
                        .header("Authorization", "Bearer " + adminToken()))
                .andReturn().getResponse().getContentAsString();

        JsonNode content = objectMapper.readTree(body).get("data").get("content");
        assertThat(content.size()).isGreaterThanOrEqualTo(1);
        for (JsonNode p : content) {
            assertThat(p.get("stockQuantity").asInt()).isEqualTo(0);
        }
    }

    @Test
    void filterByStatus_multipleStatuses_returnsAllMatching() throws Exception {
        // LOW_STOCK + OUT_OF_STOCK → COF-ETH-1KG + EQUIP-ESP-BDB
        String body = mockMvc.perform(get("/api/products?status=LOW_STOCK,OUT_OF_STOCK")
                        .header("Authorization", "Bearer " + adminToken()))
                .andReturn().getResponse().getContentAsString();

        JsonNode content = objectMapper.readTree(body).get("data").get("content");
        assertThat(content.size()).isGreaterThanOrEqualTo(2);
    }

    // ── Multi-SKU lookup ──────────────────────────────────────────────────────

    @Test
    void skuLookup_exactCaseInsensitiveMatch_returnsMatchingProducts() throws Exception {
        String body = mockMvc.perform(get("/api/products?skus=COF-ETH-1KG,DAI-OAT-C12")
                        .header("Authorization", "Bearer " + adminToken()))
                .andReturn().getResponse().getContentAsString();

        JsonNode content = objectMapper.readTree(body).get("data").get("content");
        assertThat(content.size()).isEqualTo(2);
    }

    @Test
    void skuLookup_lowercaseSkus_stillMatches() throws Exception {
        String body = mockMvc.perform(get("/api/products?skus=cof-eth-1kg")
                        .header("Authorization", "Bearer " + adminToken()))
                .andReturn().getResponse().getContentAsString();

        JsonNode content = objectMapper.readTree(body).get("data").get("content");
        assertThat(content.size()).isEqualTo(1);
        assertThat(content.get(0).get("sku").asText()).isEqualTo("COF-ETH-1KG");
    }

    // ── Pagination ────────────────────────────────────────────────────────────

    @Test
    void pagination_page0Size2_returns2ResultsWithCorrectTotalPages() throws Exception {
        String body = mockMvc.perform(get("/api/products?page=0&size=2")
                        .header("Authorization", "Bearer " + adminToken()))
                .andReturn().getResponse().getContentAsString();

        JsonNode data = objectMapper.readTree(body).get("data");
        assertThat(data.get("content").size()).isEqualTo(2);
        assertThat(data.get("currentPage").asInt()).isEqualTo(0);
        assertThat(data.get("totalPages").asInt()).isGreaterThanOrEqualTo(6); // 12 products / 2
        assertThat(data.get("first").asBoolean()).isTrue();
        assertThat(data.get("last").asBoolean()).isFalse();
    }

    @Test
    void pagination_lastPage_hasLastTrue() throws Exception {
        // With 12 products and size=10, page 1 is the last
        String body = mockMvc.perform(get("/api/products?page=1&size=10")
                        .header("Authorization", "Bearer " + adminToken()))
                .andReturn().getResponse().getContentAsString();

        JsonNode data = objectMapper.readTree(body).get("data");
        assertThat(data.get("currentPage").asInt()).isEqualTo(1);
        assertThat(data.get("last").asBoolean()).isTrue();
    }

    // ── Combined filters ──────────────────────────────────────────────────────

    @Test
    void combined_searchAndCategory_returnsIntersection() throws Exception {
        // search "oat" + category DAIRY → only Oat Milk
        String body = mockMvc.perform(get("/api/products?search=oat&category=DAIRY")
                        .header("Authorization", "Bearer " + adminToken()))
                .andReturn().getResponse().getContentAsString();

        JsonNode content = objectMapper.readTree(body).get("data").get("content");
        assertThat(content.size()).isEqualTo(1);
        assertThat(content.get(0).get("sku").asText()).isEqualTo("DAI-OAT-C12");
    }

    @Test
    void combined_categoryAndStatus_returnsIntersection() throws Exception {
        // COFFEE + LOW_STOCK → only COF-ETH-1KG (qty=14, threshold=50)
        String body = mockMvc.perform(get("/api/products?category=COFFEE&status=LOW_STOCK")
                        .header("Authorization", "Bearer " + adminToken()))
                .andReturn().getResponse().getContentAsString();

        JsonNode content = objectMapper.readTree(body).get("data").get("content");
        assertThat(content.size()).isEqualTo(1);
        assertThat(content.get(0).get("sku").asText()).isEqualTo("COF-ETH-1KG");
    }

    @Test
    void combined_searchCategoryStatus_returnsCorrectResult() throws Exception {
        // search "oat" + DAIRY + IN_STOCK → DAI-OAT-C12 (qty=48, threshold=12 → in stock)
        String body = mockMvc.perform(get("/api/products?search=oat&category=DAIRY&status=IN_STOCK")
                        .header("Authorization", "Bearer " + adminToken()))
                .andReturn().getResponse().getContentAsString();

        JsonNode content = objectMapper.readTree(body).get("data").get("content");
        assertThat(content.size()).isEqualTo(1);
        assertThat(content.get(0).get("sku").asText()).isEqualTo("DAI-OAT-C12");
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
                "sku", "TEST-SKU-002", "name", "Blocked Product",
                "category", "COFFEE", "unitPrice", 1000, "unit", "bag"
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
