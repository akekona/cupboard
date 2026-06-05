package com.cupboard.api.dto.client;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateClientRequest {

    @NotBlank
    private String name;

    private String contactName;
    private String contactEmail;
    private String contactPhone;
    private String address;
}
