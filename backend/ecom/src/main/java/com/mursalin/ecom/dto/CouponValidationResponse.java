package com.mursalin.ecom.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CouponValidationResponse {
    private boolean valid;
    private String discountType;
    private BigDecimal discountValue;
    private BigDecimal discountAmount;
    private String message;
}
