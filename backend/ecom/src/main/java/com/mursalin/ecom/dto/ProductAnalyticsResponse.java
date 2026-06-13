package com.mursalin.ecom.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ProductAnalyticsResponse {
    private List<TopItem> topSelling;
    private List<TopItem> topWishlisted;
    private List<LowStockItem> lowStock;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class TopItem {
        private int rank;
        private Long productId;
        private String name;
        private long count;
        private BigDecimal revenue;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class LowStockItem {
        private Long productId;
        private String name;
        private Long stock;
        private Integer lowStockThreshold;
    }
}
