package com.mursalin.ecom.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class AddCartItemRequest {
    private Long productId;
    private Integer quantity;
}
