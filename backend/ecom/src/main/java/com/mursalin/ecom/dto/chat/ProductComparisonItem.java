package com.mursalin.ecom.dto.chat;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductComparisonItem {
    private Long id;
    private String name;
    private java.math.BigDecimal price;
    private String primaryImageUrl;
    private Double averageRating;
    private boolean inStock;
    private List<ProductSpecCard> specs;
}
