package com.mursalin.ecom.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class WishlistItemResponse {
    private Long id;
    private Long productId;
    private ProductResponse product;
    private LocalDateTime addedAt;
}
