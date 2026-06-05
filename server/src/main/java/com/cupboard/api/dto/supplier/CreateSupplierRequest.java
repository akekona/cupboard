package com.cupboard.api.dto.supplier;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateSupplierRequest {

    @NotBlank
    private String name;

    private String contactName;
    private String contactEmail;
    private String contactPhone;
    private String address;
    private String notes;
}
