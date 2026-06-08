package com.cupboard.api.dto.user;

import java.util.List;

public record UpdateUserRequest(
        String firstName,
        String lastName,
        List<String> roleNames,
        String accountStatus
) {}
