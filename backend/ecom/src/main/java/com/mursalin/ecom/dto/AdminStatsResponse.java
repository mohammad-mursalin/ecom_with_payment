package com.mursalin.ecom.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AdminStatsResponse {
    private UserStats users;
    private OrderStats orders;
    private RevenueStats revenue;
    private ProductStats products;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class UserStats {
        private long total;
        private long newLast30Days;
        private double change30dPercent;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class OrderStats {
        private long total;
        private long pending;
        private long confirmedToday;
        private double change30dPercent;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class RevenueStats {
        private double total;
        private double last30Days;
        private double change30dPercent;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ProductStats {
        private long total;
        private long active;
        private long lowStock;
    }
}
