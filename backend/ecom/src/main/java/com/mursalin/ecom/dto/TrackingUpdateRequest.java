package com.mursalin.ecom.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TrackingUpdateRequest {
    private String trackingNumber;
    private String trackingUrl;
    private String shippingCarrier;
}
