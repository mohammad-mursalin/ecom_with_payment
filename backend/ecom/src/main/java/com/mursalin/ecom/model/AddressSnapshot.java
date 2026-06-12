package com.mursalin.ecom.model;

import jakarta.persistence.Embeddable;
import lombok.Data;

@Embeddable
@Data
public class AddressSnapshot {

    private String fullName;
    private String phone;
    private String line1;
    private String line2;
    private String city;
    private String state;
    private String pinCode;
    private String country;

    public AddressSnapshot() {
    }

    public AddressSnapshot(String fullName, String phone, String line1, String line2, String city, String state, String pinCode, String country) {
        this.fullName = fullName;
        this.phone = phone;
        this.line1 = line1;
        this.line2 = line2;
        this.city = city;
        this.state = state;
        this.pinCode = pinCode;
        this.country = country;
    }
}
