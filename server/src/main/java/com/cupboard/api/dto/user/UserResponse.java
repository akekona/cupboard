package com.cupboard.api.dto.user;

import java.time.LocalDateTime;
import java.util.List;

public record UserResponse(
        Long id,
        String email,
        String firstName,
        String lastName,
        String avatarUrl,
        String accountStatus,
        List<RoleResponse> roles,
        LocalDateTime createdAt
) {}
