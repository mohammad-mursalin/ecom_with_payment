package com.mursalin.ecom.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ProductResponse {
    private Long id;
    private String name;
    private String description;
    private BrandInfo brand;
    private CategoryInfo category;
    private BigDecimal price;
    private BigDecimal originalPrice;
    private Long stock;
    private Boolean isActive;
    private Boolean isFeatured;
    private String primaryImageUrl;
    private Double averageRating;
    private Long reviewCount;
    private List<ProductImageResponse> images;
    private List<ProductSpecResponse> specs;
    private List<String> tags;
    private List<String> highlights;
    private Boolean isWishlisted = false;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class BrandInfo {
        private Long id;
        private String name;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class CategoryInfo {
        private Long id;
        private String name;
        private String slug;
    }
}
