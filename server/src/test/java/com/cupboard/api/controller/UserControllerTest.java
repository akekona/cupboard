package com.cupboard.api.controller;

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
class UserControllerTest {

    @Autowired private MockMvc mockMvc;

    private final ObjectMapper om = new ObjectMapper().findAndRegisterModules();

    // ── List ──────────────────────────────────────────────────────────────────

    @Test
    void getAll_asAdmin_returnsSeedUsers() throws Exception {
        String body = mockMvc.perform(get("/api/users")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andReturn().getResponse().getContentAsString();

        assertThat(om.readTree(body).get("data").size()).isGreaterThanOrEqualTo(3);
    }

    @Test
    void getAll_asStaff_returns403() throws Exception {
        mockMvc.perform(get("/api/users")
                        .header("Authorization", "Bearer " + staffToken()))
                .andExpect(status().isForbidden());
    }

    // ── Get by ID ─────────────────────────────────────────────────────────────

    @Test
    void getById_existingUser_returnsUserWithRoles() throws Exception {
        mockMvc.perform(get("/api/users/1")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(1))
                .andExpect(jsonPath("$.data.email").value("ashley@cupboard.test"))
                .andExpect(jsonPath("$.data.roles").isArray());
    }

    @Test
    void getById_unknown_returns404() throws Exception {
        mockMvc.perform(get("/api/users/99999")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isNotFound());
    }

    // ── Create ────────────────────────────────────────────────────────────────

    @Test
    void createUser_validRequest_returnsCreated() throws Exception {
        Map<String, Object> req = Map.of(
                "email", "newuser@cupboard.test",
                "firstName", "New",
                "lastName", "User",
                "password", "securepass",
                "roleNames", List.of("STAFF"));

        mockMvc.perform(post("/api/users")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.email").value("newuser@cupboard.test"))
                .andExpect(jsonPath("$.data.accountStatus").value("ACTIVE"))
                .andExpect(jsonPath("$.data.roles[0].name").value("STAFF"));
    }

    @Test
    void createUser_duplicateEmail_returns422() throws Exception {
        Map<String, Object> req = Map.of(
                "email", "ashley@cupboard.test",
                "firstName", "Dup",
                "lastName", "User",
                "password", "securepass",
                "roleNames", List.of("STAFF"));

        mockMvc.perform(post("/api/users")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(req)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void createUser_missingRoles_returns422() throws Exception {
        Map<String, Object> req = Map.of(
                "email", "newuser2@cupboard.test",
                "firstName", "New",
                "lastName", "User",
                "password", "securepass",
                "roleNames", List.of("NONEXISTENT_ROLE"));

        mockMvc.perform(post("/api/users")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(req)))
                .andExpect(status().isUnprocessableEntity());
    }

    // ── Update ────────────────────────────────────────────────────────────────

    @Test
    void updateUser_changeFirstName_returnsUpdated() throws Exception {
        Map<String, Object> req = Map.of("firstName", "Updated");

        mockMvc.perform(put("/api/users/2")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.firstName").value("Updated"));
    }

    // ── Deactivate ────────────────────────────────────────────────────────────

    @Test
    void deactivateUser_otherUser_setsInactive() throws Exception {
        mockMvc.perform(patch("/api/users/2/deactivate")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/users/2")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(jsonPath("$.data.accountStatus").value("INACTIVE"));
    }

    @Test
    void deactivateUser_selfDeactivation_returns422() throws Exception {
        // Admin (id=1) tries to deactivate themselves
        mockMvc.perform(patch("/api/users/1/deactivate")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.success").value(false));
    }

    // ── Reactivate ────────────────────────────────────────────────────────────

    @Test
    void reactivateUser_inactiveUser_setsActive() throws Exception {
        // First deactivate user 2
        mockMvc.perform(patch("/api/users/2/deactivate")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk());

        // Then reactivate
        mockMvc.perform(patch("/api/users/2/reactivate")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accountStatus").value("ACTIVE"));
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
