package com.mursalin.ecom.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
public class CouponValidationResult {
    private boolean valid;
    private String message;
    private String discountType;
    private BigDecimal discountValue;
    private String couponCode;
    private BigDecimal discountAmount;
}
