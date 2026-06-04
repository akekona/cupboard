package com.cupboard.api.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class LoginResponse {
    private String token;
    private String email;
    private String firstName;
    private String lastName;
    private List<String> roles;
}
