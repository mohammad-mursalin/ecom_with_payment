package com.mursalin.ecom.service;

import com.mursalin.ecom.dto.CreateOrderRequest;
import com.mursalin.ecom.dto.InitiateOrderRequest;
import com.mursalin.ecom.dto.InitiateOrderResponse;
import com.mursalin.ecom.dto.OrderItemDTO;
import com.mursalin.ecom.dto.OrderStatusUpdateResponse;
import com.mursalin.ecom.dto.OrderSummaryDTO;
import com.mursalin.ecom.dto.OrderSummaryItemDTO;
import com.mursalin.ecom.dto.PaginatedResponse;
import com.mursalin.ecom.model.Order;
import org.springframework.data.domain.Pageable;

public interface OrderService {
    Order createOrder(CreateOrderRequest request, Long userId, String customerEmail);

    InitiateOrderResponse initiateOrder(InitiateOrderRequest request, Long userId, String customerEmail);

    InitiateOrderResponse confirmOrder(Long orderId, String paymentIntentId, Long userId);

    Order processSuccessfulPayment(String stripeSessionId, String paymentIntentId);

    Order processFailedPayment(String stripeSessionId);

    Order processSuccessfulPaymentByIntentId(String paymentIntentId);

    void updateOrderSessionId(Long orderId, String sessionId);

    Order getOrderById(Long id);

    Order getOrderByIdForUser(Long id, Long userId);

    PaginatedResponse<OrderSummaryDTO> getOrdersByUserId(Long userId, Pageable pageable);

    PaginatedResponse<OrderSummaryDTO> getAllOrders(Pageable pageable);

    PaginatedResponse<OrderSummaryDTO> getOrdersByUserIdAndStatus(Long userId, Order.OrderStatus status, Pageable pageable);

    PaginatedResponse<OrderSummaryDTO> getAllOrdersByStatus(Order.OrderStatus status, Pageable pageable);

    Order cancelOrder(Long orderId, Long userId);

    OrderStatusUpdateResponse updateOrderStatus(Long orderId, Order.OrderStatus status);

    Order adminUpdateOrderStatus(Long orderId, Order.OrderStatus newStatus, String note, String trackingNumber, String courierName, Long adminUserId);

    com.mursalin.ecom.dto.OrderStatusUpdateResponse updateOrderTracking(Long orderId, String trackingNumber, String trackingUrl, String shippingCarrier);

    OrderSummaryDTO toOrderSummaryDTO(Order order);
}
