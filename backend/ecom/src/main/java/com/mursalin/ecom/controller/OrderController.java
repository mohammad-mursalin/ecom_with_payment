package com.mursalin.ecom.controller;

import com.mursalin.ecom.dto.*;
import com.mursalin.ecom.model.Order;
import com.mursalin.ecom.model.UserPrinciples;
import com.mursalin.ecom.service.OrderService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private static final Logger logger = LoggerFactory.getLogger(OrderController.class);

    @Autowired
    private OrderService orderService;

    @PostMapping("/initiate")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<InitiateOrderResponse> initiateOrder(
            @RequestBody InitiateOrderRequest request,
            @AuthenticationPrincipal UserPrinciples userPrinciple
    ) {
        try {
            String customerEmail = userPrinciple.getUsername();
            InitiateOrderResponse response = orderService.initiateOrder(
                    request, userPrinciple.getUserId(), customerEmail
            );
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Order initiation failed for userId={}: {}", userPrinciple.getUserId(), e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{id}/confirm")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<InitiateOrderResponse> confirmOrder(
            @PathVariable Long id,
            @RequestBody ConfirmOrderRequest request,
            @AuthenticationPrincipal UserPrinciples userPrinciple
    ) {
        try {
            InitiateOrderResponse response = orderService.confirmOrder(
                    id, request.getPaymentIntentId(), userPrinciple.getUserId()
            );
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Order confirmation failed for orderId={}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(null);
        }
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<PaginatedResponse<OrderSummaryDTO>> getAllOrders(
            @AuthenticationPrincipal UserPrinciples userPrinciple,
            @RequestParam(required = false, defaultValue = "ALL") String status,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "10") int pageSize
    ) {
        Pageable pageable = PageRequest.of(page, pageSize, org.springframework.data.domain.Sort.by("createdAt").descending());
        boolean isAdmin = userPrinciple.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        boolean isUser = userPrinciple.getUserId() != null && userPrinciple.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_USER"));

        Page<Order> orderPage;
        Order.OrderStatus statusEnum = "ALL".equalsIgnoreCase(status) ? null : parseStatus(status);

        if (isAdmin && !isUser) {
            orderPage = (statusEnum == null) ? orderService.getAllOrders(pageable) : orderService.getAllOrdersByStatus(statusEnum, pageable);
        } else {
            Long uid = userPrinciple.getUserId();
            orderPage = (statusEnum == null) ? orderService.getOrdersByUserId(uid, pageable) : orderService.getOrdersByUserIdAndStatus(uid, statusEnum, pageable);
        }

        List<OrderSummaryDTO> content = orderPage.getContent().stream()
                .map(order -> {
                    OrderSummaryDTO dto = new OrderSummaryDTO();
                    dto.setId(order.getId());
                    dto.setCreatedAt(order.getCreatedAt());
                    dto.setItemCount(order.getOrderItems().size());
                    dto.setTotalAmount(order.getTotalAmount());
                    dto.setStatus(order.getStatus().name());
                    dto.setItems(order.getOrderItems().stream()
                            .map(OrderSummaryItemDTO::fromOrderItem)
                            .toList());
                    return dto;
                })
                .toList();

        PaginatedResponse<OrderSummaryDTO> result = new PaginatedResponse<>(
                content, page, orderPage.getTotalPages(), orderPage.getTotalElements(), pageSize,
                !orderPage.hasPrevious(), !orderPage.hasNext()
        );
        return ResponseEntity.ok(result);
    }

    @PutMapping("/{id}/cancel")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<OrderDetailsResponse> cancelOrder(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrinciples userPrinciple
    ) {
        try {
            Order order = orderService.cancelOrder(id, userPrinciple.getUserId());
            return ResponseEntity.ok(OrderDetailsResponse.fromOrder(order));
        } catch (AccessDeniedException e) {
            logger.warn("Unauthorized cancel attempt on orderId={} by userId={}", id, userPrinciple.getUserId());
            return ResponseEntity.status(403).build();
        } catch (RuntimeException e) {
            logger.error("Cancel order failed for orderId={}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    private static Order.OrderStatus parseStatus(String status) {
        try {
            return Order.OrderStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<?> getOrderDetails(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrinciples userPrinciple
    ) {
        Order order;
        if (userPrinciple.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            order = orderService.getOrderById(id);
        } else {
            order = orderService.getOrderByIdForUser(id, userPrinciple.getUserId());
        }

        if (order != null) {
            return ResponseEntity.ok(OrderDetailsResponse.fromOrder(order));
        }
        return ResponseEntity.status(404).body(
            new com.mursalin.ecom.dto.ErrorResponse(404, "Not Found", "Order not found with id: " + id)
        );
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Order> updateOrderStatus(
            @PathVariable Long id,
            @RequestParam String status
    ) {
        try {
            Order.OrderStatus orderStatus = Order.OrderStatus.valueOf(status.toUpperCase());
            Order order = orderService.updateOrderStatus(id, orderStatus);
            return ResponseEntity.ok(order);
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid order status value: {}", status);
            return ResponseEntity.badRequest().build();
        } catch (RuntimeException e) {
            logger.error("Error updating order status for id={}: {}", id, e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    @PatchMapping("/{id}/tracking")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Order> updateOrderTracking(
            @PathVariable Long id,
            @RequestBody com.mursalin.ecom.dto.TrackingUpdateRequest request
    ) {
        try {
            Order order = orderService.updateOrderTracking(
                    id,
                    request.getTrackingNumber(),
                    request.getTrackingUrl(),
                    request.getShippingCarrier()
            );
            return ResponseEntity.ok(order);
        } catch (RuntimeException e) {
            logger.error("Error updating tracking for id={}: {}", id, e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }
}

// Helper DTO for confirm endpoint
class ConfirmOrderRequest {
    private String paymentIntentId;

    public String getPaymentIntentId() { return paymentIntentId; }
    public void setPaymentIntentId(String paymentIntentId) { this.paymentIntentId = paymentIntentId; }
}
