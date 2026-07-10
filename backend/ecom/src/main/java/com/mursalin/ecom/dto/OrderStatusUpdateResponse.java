package com.mursalin.ecom.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderStatusUpdateResponse {
    private Long id;
    private String status;
    private BigDecimal totalAmount;
    private String trackingNumber;
    private String trackingUrl;
    private String shippingCarrier;
    private LocalDateTime updatedAt;

    public static OrderStatusUpdateResponse fromEntity(com.mursalin.ecom.model.Order order) {
        return new OrderStatusUpdateResponse(
                order.getId(),
                order.getStatus() != null ? order.getStatus().name() : null,
                order.getTotalAmount(),
                order.getTrackingNumber(),
                order.getTrackingUrl(),
                order.getShippingCarrier(),
                order.getUpdatedAt()
        );
    }
}
