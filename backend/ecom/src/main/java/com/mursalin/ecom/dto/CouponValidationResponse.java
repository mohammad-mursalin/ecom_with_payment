package com.mursalin.ecom.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.math.BigDecimal;

@Data
@AllArgsConstructor
public class CouponValidationResponse {
    private boolean valid;
    private String discountType;
    private BigDecimal discountValue;
    private BigDecimal discountAmount;
    private String message;
}
