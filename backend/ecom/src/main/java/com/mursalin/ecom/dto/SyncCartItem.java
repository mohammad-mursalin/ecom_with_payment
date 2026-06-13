package com.mursalin.ecom.dto;

import lombok.Data;

@Data
public class SyncCartItem {
    private Long productId;
    private Integer quantity;
}
