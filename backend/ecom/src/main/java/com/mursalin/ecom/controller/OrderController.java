package com.mursalin.ecom.controller;

import com.mursalin.ecom.model.Order;
import com.mursalin.ecom.model.UserPrinciples;
import com.mursalin.ecom.service.OrderService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin
public class OrderController {

    private static final Logger logger = LoggerFactory.getLogger(OrderController.class);

    @Autowired
    private OrderService orderService;

    @GetMapping
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<List<Order>> getAllOrders(@AuthenticationPrincipal UserPrinciples userPrinciple) {
        List<Order> orders;
        if (userPrinciple.getUserId() != null && userPrinciple.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_USER"))) {
            // Regular user: only their own orders
            orders = orderService.getOrdersByUserId(userPrinciple.getUserId());
        } else {
            // Admin: all orders
            orders = orderService.getAllOrders();
        }
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<Order> getOrderById(@PathVariable Long id, @AuthenticationPrincipal UserPrinciples userPrinciple) {
        Order order;
        if (userPrinciple.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            // Admin can access any order
            order = orderService.getOrderById(id);
        } else {
            // Regular user: only their own orders
            order = orderService.getOrderByIdForUser(id, userPrinciple.getUserId());
        }
        return order != null
                ? ResponseEntity.ok(order)
                : ResponseEntity.notFound().build();
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
}
