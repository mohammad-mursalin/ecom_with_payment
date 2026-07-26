package com.mursalin.ecom.service.Impl;

import com.mursalin.ecom.model.Order;

import com.mursalin.ecom.service.WebSocketService;
import lombok.RequiredArgsConstructor;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class WebSocketServiceImpl implements WebSocketService {

    private static final Logger logger = LoggerFactory.getLogger(WebSocketService.class);

    private final SimpMessagingTemplate messagingTemplate;

    @Override
    public void notifyOrderUpdate(Order order) {
        Map<String, Object> message = new HashMap<>();
        message.put("orderId", order.getId());
        message.put("status", order.getStatus().name());
        message.put("totalAmount", order.getTotalAmount());
        message.put("trackingNumber", order.getTrackingNumber());
        message.put("trackingUrl", order.getTrackingUrl());
        message.put("shippingCarrier", order.getShippingCarrier());

        String targetUser = order.getUser().getEmail(); // matches getUsername() / JWT subject

        logger.info("Sending order update via WebSocket: orderId={}, status={}, to={}",
                    order.getId(), order.getStatus(), targetUser);

        messagingTemplate.convertAndSendToUser(targetUser, "/queue/orders", message);
    }

    @Override
    public void notifyPaymentUpdate(Long orderId, String status) {
        Map<String, Object> message = new HashMap<>();
        message.put("orderId", orderId);
        message.put("paymentStatus", status);

        logger.info("Sending payment update via WebSocket: orderId={}, paymentStatus={}", orderId, status);
        messagingTemplate.convertAndSend("/topic/payments", (Object) message);
        messagingTemplate.convertAndSend("/topic/payments/" + orderId, (Object) message);
    }

    @Override
    public void notifyOrderStatusChange(Long orderId, String oldStatus, String newStatus) {
        Map<String, Object> message = new HashMap<>();
        message.put("orderId", orderId);
        message.put("oldStatus", oldStatus);
        message.put("newStatus", newStatus);

        logger.info("Sending order status change via WebSocket: orderId={}, {} -> {}", orderId, oldStatus, newStatus);
        messagingTemplate.convertAndSend("/topic/orders/" + orderId + "/status", (Object) message);
    }
}
