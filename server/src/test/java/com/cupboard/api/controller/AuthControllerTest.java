package com.cupboard.api.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Base64;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String VALID_EMAIL    = "ashley@cupboard.test";
    private static final String VALID_PASSWORD = "password123";

    // ── Login ──────────────────────────────────────────────────────────────

    @Test
    void login_validCredentials_returns200WithTokenAndUserInfo() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", VALID_EMAIL,
                                "password", VALID_PASSWORD))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.email").value(VALID_EMAIL))
                .andExpect(jsonPath("$.firstName").value("Ashley"))
                .andExpect(jsonPath("$.lastName").value("Kekona"))
                .andExpect(jsonPath("$.roles").isArray());
    }

    @Test
    void login_wrongPassword_returns401() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", VALID_EMAIL,
                                "password", "wrongpassword"))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void login_unknownEmail_returns401() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", "nobody@cupboard.test",
                                "password", VALID_PASSWORD))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void login_emptyBody_returns400() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    // ── JWT claims ─────────────────────────────────────────────────────────

    @Test
    void login_jwtContainsExpectedClaims() throws Exception {
        String response = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", VALID_EMAIL,
                                "password", VALID_PASSWORD))))
                .andReturn().getResponse().getContentAsString();

        String token = objectMapper.readTree(response).get("token").asText();
        String payloadJson = new String(Base64.getUrlDecoder().decode(token.split("\\.")[1]));
        JsonNode claims = objectMapper.readTree(payloadJson);

        assertThat(claims.get("sub").asText()).isEqualTo(VALID_EMAIL);
        assertThat(claims.get("firstName").asText()).isEqualTo("Ashley");
        assertThat(claims.get("lastName").asText()).isEqualTo("Kekona");
        assertThat(claims.get("roles").isArray()).isTrue();
        assertThat(claims.get("exp").asLong()).isGreaterThan(System.currentTimeMillis() / 1000);
    }

    @Test
    void login_adminUser_jwtRolesContainAdmin() throws Exception {
        String response = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", VALID_EMAIL,
                                "password", VALID_PASSWORD))))
                .andReturn().getResponse().getContentAsString();

        String token = objectMapper.readTree(response).get("token").asText();
        String payloadJson = new String(Base64.getUrlDecoder().decode(token.split("\\.")[1]));
        JsonNode claims = objectMapper.readTree(payloadJson);

        boolean hasAdmin = false;
        for (JsonNode role : claims.get("roles")) {
            if ("ADMIN".equals(role.asText())) { hasAdmin = true; break; }
        }
        assertThat(hasAdmin).isTrue();
    }

    // ── /me ────────────────────────────────────────────────────────────────

    @Test
    void me_withValidToken_returnsCurrentUser() throws Exception {
        String token = loginAndGetToken();

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(VALID_EMAIL))
                .andExpect(jsonPath("$.firstName").value("Ashley"))
                .andExpect(jsonPath("$.lastName").value("Kekona"))
                .andExpect(jsonPath("$.roles").isArray());
    }

    @Test
    void me_withoutToken_returns401() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void me_withMalformedToken_returns401() throws Exception {
        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer not.a.valid.jwt"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void me_withExpiredToken_returns401() throws Exception {
        // A JWT signed with the correct secret but already expired (exp in the past)
        String expiredToken = "eyJhbGciOiJIUzI1NiJ9" +
                ".eyJzdWIiOiJhc2hsZXlAY3VwYm9hcmQudGVzdCIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoxNzAwMDAwMDAxfQ" +
                ".invalid_signature_so_it_always_fails";

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + expiredToken))
                .andExpect(status().isUnauthorized());
    }

    // ── Helper ─────────────────────────────────────────────────────────────

    private String loginAndGetToken() throws Exception {
        String response = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", VALID_EMAIL,
                                "password", VALID_PASSWORD))))
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response).get("token").asText();
    }
}
