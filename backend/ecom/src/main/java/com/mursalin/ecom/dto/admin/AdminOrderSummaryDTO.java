package com.mursalin.ecom.dto.admin;

import com.mursalin.ecom.model.Order;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminOrderSummaryDTO {

    private Long id;
    private String customerEmail;
    private String status;
    private BigDecimal totalAmount;
    private String paymentMethod;
    private LocalDateTime createdAt;
    private int itemCount;

    public static AdminOrderSummaryDTO fromOrder(Order order) {
        AdminOrderSummaryDTO dto = new AdminOrderSummaryDTO();
        dto.setId(order.getId());
        dto.setCustomerEmail(order.getCustomerEmail());
        dto.setStatus(order.getStatus().name());
        dto.setTotalAmount(order.getTotalAmount());
        dto.setPaymentMethod(order.getPaymentMethod());
        dto.setCreatedAt(order.getCreatedAt());
        dto.setItemCount(order.getOrderItems() != null
            ? order.getOrderItems().size() : 0);
        return dto;
    }
}
