package com.mursalin.ecom.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AdminProductListResponse {
    private Long id;
    private String name;
    private CategoryInfo category;
    private BrandInfo brand;
    private BigDecimal price;
    private BigDecimal originalPrice;
    private Long stockQuantity;
    private Integer lowStockThreshold;
    private boolean isActive;
    private boolean isFeatured;
    private String imageUrl;
    private Double averageRating;
    private Long reviewCount;
    private LocalDateTime createdAt;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class CategoryInfo {
        private Long id;
        private String name;
        private String slug;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class BrandInfo {
        private Long id;
        private String name;
    }
}
