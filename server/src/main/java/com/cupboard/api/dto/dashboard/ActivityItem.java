package com.cupboard.api.dto.dashboard;

import java.time.LocalDateTime;

public record ActivityItem(
        long id,
        String type,
        String description,
        String subtext,
        LocalDateTime createdAt
) {}
