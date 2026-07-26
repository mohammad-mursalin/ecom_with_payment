package com.mursalin.ecom.service;

import com.mursalin.ecom.model.Order;

public interface WebSocketService {
    void notifyOrderUpdate(Order order);

    void notifyPaymentUpdate(Long orderId, String status);

    void notifyOrderStatusChange(Long orderId, String oldStatus, String newStatus);
}
