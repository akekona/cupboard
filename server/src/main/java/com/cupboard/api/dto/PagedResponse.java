package com.cupboard.api.dto;

import java.util.List;

public record PagedResponse<T>(
        List<T> content,
        int currentPage,
        int totalPages,
        long totalElements,
        int pageSize,
        boolean first,
        boolean last
) {}
