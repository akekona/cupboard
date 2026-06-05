package com.cupboard.api.dto.product;

import com.cupboard.api.enums.Currency;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateProductRequest {

    @NotBlank
    private String sku;

    @NotBlank
    private String name;

    private String description;

    @NotBlank
    private String category;

    @NotNull
    @Positive
    private Long unitPrice;

    private Currency currency = Currency.USD;

    @NotBlank
    private String unit;

    private int stockQuantity = 0;

    private int reorderThreshold = 0;
}
