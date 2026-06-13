package com.mursalin.ecom.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class ValidateCouponRequest {
    private String code;
    private BigDecimal orderSubtotal;
}
