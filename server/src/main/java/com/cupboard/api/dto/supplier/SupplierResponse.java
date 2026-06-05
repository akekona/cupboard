package com.cupboard.api.dto.supplier;

import java.util.List;

public record SupplierResponse(
        Long id,
        String name,
        String contactName,
        String contactEmail,
        String contactPhone,
        String address,
        String notes,
        List<SupplierProductInfo> products
) {}
