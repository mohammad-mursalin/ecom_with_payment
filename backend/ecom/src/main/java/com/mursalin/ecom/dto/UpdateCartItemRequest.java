package com.mursalin.ecom.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class UpdateCartItemRequest {
    private Integer quantity;
}
