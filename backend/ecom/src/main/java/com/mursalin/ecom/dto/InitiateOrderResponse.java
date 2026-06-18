package com.mursalin.ecom.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InitiateOrderResponse {
    private Long orderId;
    private String clientSecret;
    private OrderSummary order;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderSummary {
        private Long id;
        private String status;
        private BigDecimal subtotal;
        private BigDecimal discountAmount;
        private BigDecimal taxAmount;
        private BigDecimal shippingFee;
        private BigDecimal totalAmount;
        private Integer itemCount;
        private String estimatedDelivery;
        private List<OrderItemDTO> items;
    }
}
