package com.mursalin.ecom.dto.chat;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductCard {
    private Long id;
    private String name;
    private java.math.BigDecimal price;
    private String primaryImageUrl;
    private Double averageRating;
    private boolean inStock;
}
