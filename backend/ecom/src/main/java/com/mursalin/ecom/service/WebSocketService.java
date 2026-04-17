package com.mursalin.ecom.service;

import com.mursalin.ecom.model.Order;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class WebSocketService {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public void notifyOrderUpdate(Order order) {
        Map<String, Object> message = new HashMap<>();
        message.put("orderId", order.getId());
        message.put("status", order.getStatus().name());
        message.put("totalAmount", order.getTotalAmount());
        message.put("customerEmail", order.getCustomerEmail());
        message.put("orderDate", order.getOrderDate().toString());
        
        // Send to all subscribers of /topic/orders
        messagingTemplate.convertAndSend("/topic/orders", (Object) message);
        
        // Also send to specific order channel
        messagingTemplate.convertAndSend("/topic/orders/" + order.getId(), (Object) message);
    }

    public void notifyPaymentUpdate(Long orderId, String status) {
        Map<String, Object> message = new HashMap<>();
        message.put("orderId", orderId);
        message.put("paymentStatus", status);
        
        // Send to all subscribers of /topic/payments
        messagingTemplate.convertAndSend("/topic/payments", (Object) message);
        
        // Also send to specific order payment channel
        messagingTemplate.convertAndSend("/topic/payments/" + orderId, (Object) message);
    }

    public void notifyOrderStatusChange(Long orderId, String oldStatus, String newStatus) {
        Map<String, Object> message = new HashMap<>();
        message.put("orderId", orderId);
        message.put("oldStatus", oldStatus);
        message.put("newStatus", newStatus);
        
        messagingTemplate.convertAndSend("/topic/orders/" + orderId + "/status", (Object) message);
    }
}