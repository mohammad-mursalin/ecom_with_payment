package com.mursalin.ecom.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AddressResponse {
    private Long id;
    private String label;
    private String fullName;
    private String phone;
    private String line1;
    private String line2;
    private String city;
    private String state;
    private String pinCode;
    private String country;
    private Boolean isDefault;
    private LocalDateTime createdAt;

    public static AddressResponse fromEntity(com.mursalin.ecom.model.Address address) {
        return new AddressResponse(
                address.getId(),
                address.getLabel(),
                address.getFullName(),
                address.getPhone(),
                address.getLine1(),
                address.getLine2(),
                address.getCity(),
                address.getState(),
                address.getPinCode(),
                address.getCountry(),
                address.isDefault(),
                address.getCreatedAt()
        );
    }
}
