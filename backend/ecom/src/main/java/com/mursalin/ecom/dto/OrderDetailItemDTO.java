package com.mursalin.ecom.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderDetailItemDTO {
    private Long id;
    private Long productId;
    private String productName;
    private String primaryImageUrl;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal lineTotal;

    public static OrderDetailItemDTO fromOrderItem(com.mursalin.ecom.model.OrderItem orderItem) {
        OrderDetailItemDTO dto = new OrderDetailItemDTO();
        dto.setId(orderItem.getId());
        dto.setProductId(orderItem.getProductId() != null ? orderItem.getProductId().longValue() : null);
        dto.setProductName(orderItem.getProductName());
        dto.setPrimaryImageUrl(orderItem.getProductImageUrl());
        dto.setQuantity(orderItem.getQuantity());
        dto.setUnitPrice(orderItem.getUnitPrice());
        dto.setLineTotal(orderItem.getSubtotal());
        return dto;
    }
}
