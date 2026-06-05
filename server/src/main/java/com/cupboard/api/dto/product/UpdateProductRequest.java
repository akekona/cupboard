package com.cupboard.api.dto.product;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateProductRequest {
    private String sku;
    private String name;
    private String description;
    private String category;
    private Long unitPrice;
    private String currency;
    private String unit;
    private Integer stockQuantity;
    private Integer reorderThreshold;
}
