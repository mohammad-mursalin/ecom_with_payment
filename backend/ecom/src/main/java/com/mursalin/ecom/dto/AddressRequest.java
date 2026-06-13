package com.mursalin.ecom.dto;

import lombok.Data;

@Data
public class AddressRequest {
    private String label;

    private String fullName;

    private String phone;

    private String line1;

    private String line2;

    private String city;

    private String state;

    private String pinCode;

    private String country;

    private boolean isDefault = false;
}
