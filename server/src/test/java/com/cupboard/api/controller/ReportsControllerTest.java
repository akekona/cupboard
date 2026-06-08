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

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ReportsControllerTest {

    @Autowired private MockMvc mockMvc;

    private final ObjectMapper om = new ObjectMapper().findAndRegisterModules();

    @Test
    void getReports_asAdmin_returnsAllSections() throws Exception {
        mockMvc.perform(get("/api/reports")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.revenueByMonth").isArray())
                .andExpect(jsonPath("$.data.topClients").isArray())
                .andExpect(jsonPath("$.data.topProducts").isArray())
                .andExpect(jsonPath("$.data.orderVolumeByMonth").isArray());
    }

    @Test
    void getReports_asAdmin_revenueByMonthHasTwelveEntries() throws Exception {
        String body = mockMvc.perform(get("/api/reports")
                        .header("Authorization", "Bearer " + adminToken()))
                .andReturn().getResponse().getContentAsString();

        assertThat(om.readTree(body).get("data").get("revenueByMonth").size()).isEqualTo(12);
    }

    @Test
    void getReports_asAdmin_orderVolumeByMonthHasTwelveEntries() throws Exception {
        String body = mockMvc.perform(get("/api/reports")
                        .header("Authorization", "Bearer " + adminToken()))
                .andReturn().getResponse().getContentAsString();

        assertThat(om.readTree(body).get("data").get("orderVolumeByMonth").size()).isEqualTo(12);
    }

    @Test
    void getReports_asStaff_returns403() throws Exception {
        mockMvc.perform(get("/api/reports")
                        .header("Authorization", "Bearer " + staffToken()))
                .andExpect(status().isForbidden());
    }

    @Test
    void getReports_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/reports"))
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
