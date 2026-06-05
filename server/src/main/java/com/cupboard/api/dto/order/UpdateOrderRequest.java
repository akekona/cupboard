package com.cupboard.api.dto.order;

import jakarta.validation.Valid;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
public class UpdateOrderRequest {

    private LocalDate needBy;

    private String notes;

    @Valid
    private List<OrderItemRequest> items;
}
