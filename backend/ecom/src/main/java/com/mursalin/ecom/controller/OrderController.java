package com.mursalin.ecom.controller;

import com.mursalin.ecom.model.Order;
import com.mursalin.ecom.service.OrderService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
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
    public ResponseEntity<List<Order>> getAllOrders() {
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Order> getOrderById(@PathVariable Long id) {
        Order order = orderService.getOrderById(id);
        return order != null
                ? ResponseEntity.ok(order)
                : ResponseEntity.notFound().build();
    }

    @PatchMapping("/{id}/status")
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
