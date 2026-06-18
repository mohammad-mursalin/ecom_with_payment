package com.mursalin.ecom.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InitiateOrderRequest {
    private Long addressId;
    private AddressSnapshotRequest addressSnapshot;
    private String couponCode;
    private String shippingMethod;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AddressSnapshotRequest {
        private String fullName;
        private String phone;
        private String line1;
        private String line2;
        private String city;
        private String state;
        private String pinCode;
        private String country;
    }
}
