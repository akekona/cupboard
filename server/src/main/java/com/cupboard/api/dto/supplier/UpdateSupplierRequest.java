package com.cupboard.api.dto.supplier;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateSupplierRequest {
    private String name;
    private String contactName;
    private String contactEmail;
    private String contactPhone;
    private String address;
    private String notes;
}
