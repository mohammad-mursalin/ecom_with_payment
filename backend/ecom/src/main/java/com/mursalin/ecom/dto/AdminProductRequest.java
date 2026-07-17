package com.mursalin.ecom.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class AdminProductRequest {
    private String name;
    private String description;
    private Long categoryId;
    private Long brandId;
    private BigDecimal price;
    private BigDecimal originalPrice;
    private Long stockQuantity;
    private Integer lowStockThreshold;
    private String brandName;
    private List<String> tags;
    private List<SpecItem> specs;
    private String imageUrl;

    private boolean isActive = true;
    private boolean isFeatured = false;

    public boolean getIsActive() { return isActive; }
    public boolean getIsFeatured() { return isFeatured; }

    @Data
    public static class SpecItem {
        private String specKey;
        private String specValue;
    }
}
