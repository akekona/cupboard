package com.cupboard.api.dto.client;

public record ClientResponse(
        Long id,
        String name,
        String contactName,
        String contactEmail,
        String contactPhone,
        String address,
        String accountStatus
) {}
