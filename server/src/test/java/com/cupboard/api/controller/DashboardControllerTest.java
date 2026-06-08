package com.cupboard.api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class DashboardControllerTest {

    @Autowired private MockMvc mockMvc;

    private final ObjectMapper om = new ObjectMapper().findAndRegisterModules();

    @Test
    void getDashboard_asAdmin_returnsAllFields() throws Exception {
        mockMvc.perform(get("/api/dashboard")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.stats").isMap())
                .andExpect(jsonPath("$.data.stats.totalRevenueThisMonth").isNumber())
                .andExpect(jsonPath("$.data.stats.revenueLastMonth").isNumber())
                .andExpect(jsonPath("$.data.stats.ordersThisMonth").isNumber())
                .andExpect(jsonPath("$.data.stats.ordersLastMonth").isNumber())
                .andExpect(jsonPath("$.data.stats.lowStockCount").isNumber())
                .andExpect(jsonPath("$.data.stats.outstandingInvoicesAmount").isNumber())
                .andExpect(jsonPath("$.data.stats.outstandingInvoicesCount").isNumber())
                .andExpect(jsonPath("$.data.stats.overdueInvoicesCount").isNumber())
                .andExpect(jsonPath("$.data.revenueByMonth").isArray())
                .andExpect(jsonPath("$.data.recentActivity").isArray());
    }

    @Test
    void getDashboard_asAdmin_revenueByMonthHasSixEntries() throws Exception {
        String body = mockMvc.perform(get("/api/dashboard")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        int size = om.readTree(body).get("data").get("revenueByMonth").size();
        org.assertj.core.api.Assertions.assertThat(size).isEqualTo(6);
    }

    @Test
    void getDashboard_asStaff_returnsOk() throws Exception {
        mockMvc.perform(get("/api/dashboard")
                        .header("Authorization", "Bearer " + staffToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void getDashboard_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/dashboard"))
                .andExpect(status().isUnauthorized());
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
