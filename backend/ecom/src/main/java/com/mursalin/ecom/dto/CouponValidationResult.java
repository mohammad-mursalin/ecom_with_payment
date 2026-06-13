package com.mursalin.ecom.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class CouponValidationResult {
    private boolean valid;
    private String message;
    private String discountType;
    private BigDecimal discountValue;
    private String couponCode;
    private BigDecimal discountAmount;

    public CouponValidationResult(boolean valid, String message, String discountType,
                                  BigDecimal discountValue, String couponCode, BigDecimal discountAmount) {
        this.valid = valid;
        this.message = message;
        this.discountType = discountType;
        this.discountValue = discountValue;
        this.couponCode = couponCode;
        this.discountAmount = discountAmount;
    }
}
