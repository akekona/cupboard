package com.cupboard.api.dto.order;

import com.cupboard.api.enums.Currency;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
public class CreateOrderRequest {

    @NotNull
    private Long clientId;

    private Currency currency = Currency.USD;

    private LocalDate needBy;

    private String notes;

    @NotNull
    @NotEmpty
    @Valid
    private List<OrderItemRequest> items;
}
