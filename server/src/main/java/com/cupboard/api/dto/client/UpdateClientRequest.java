package com.cupboard.api.dto.client;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateClientRequest {
    private String name;
    private String contactName;
    private String contactEmail;
    private String contactPhone;
    private String address;
}
