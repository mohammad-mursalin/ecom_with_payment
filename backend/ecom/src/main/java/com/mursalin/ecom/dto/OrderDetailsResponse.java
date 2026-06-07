package com.mursalin.ecom.dto;

import com.mursalin.ecom.model.Order;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderDetailsResponse {

    private Long id;
    private Long userId;
    private LocalDateTime orderDate;
    private BigDecimal totalAmount;
    private Order.OrderStatus status;
    private String stripeSessionId;
    private String stripePaymentIntentId;
    private String customerEmail;
    private String shippingAddress;
    private BigDecimal shippingCost;
    private String shippingMethod;
    private String trackingNumber;
    private String trackingUrl;
    private String shippingCarrier;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<OrderItemDTO> orderItems;
    private PaymentDTO payment;

    public static OrderDetailsResponse fromOrder(Order order) {
        OrderDetailsResponse response = new OrderDetailsResponse();
        response.setId(order.getId());
        response.setUserId(order.getUserId());
        response.setOrderDate(order.getOrderDate());
        response.setTotalAmount(order.getTotalAmount());
        response.setStatus(order.getStatus());
        response.setStripeSessionId(order.getStripeSessionId());
        response.setStripePaymentIntentId(order.getStripePaymentIntentId());
        response.setCustomerEmail(order.getCustomerEmail());
        response.setShippingAddress(order.getShippingAddress());
        response.setShippingCost(order.getShippingCost());
        response.setShippingMethod(order.getShippingMethod());
        response.setTrackingNumber(order.getTrackingNumber());
        response.setTrackingUrl(order.getTrackingUrl());
        response.setShippingCarrier(order.getShippingCarrier());
        response.setCreatedAt(order.getCreatedAt());
        response.setUpdatedAt(order.getUpdatedAt());
        response.setOrderItems(order.getOrderItems().stream()
                .map(OrderItemDTO::fromOrderItem)
                .toList());
        if (order.getPayment() != null) {
            response.setPayment(PaymentDTO.fromPayment(order.getPayment()));
        }
        return response;
    }
}
