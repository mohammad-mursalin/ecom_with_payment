package com.mursalin.ecom.service;

import com.mursalin.ecom.dto.CreateOrderRequest;
import com.mursalin.ecom.dto.OrderItemDTO;
import com.mursalin.ecom.model.*;
import com.mursalin.ecom.repository.OrderRepository;
import com.mursalin.ecom.repository.PaymentRepository;
import com.mursalin.ecom.repository.ProductRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private ProductRepo productRepository;

    @Autowired
    private WebSocketService webSocketService;

    @Transactional
    public Order createOrder(CreateOrderRequest request) {
        BigDecimal totalAmount = BigDecimal.ZERO;
        for (OrderItemDTO item : request.getItems()) {
            BigDecimal subtotal = item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
            totalAmount = totalAmount.add(subtotal);
        }

        Order order = new Order();
        order.setUserId(null);
        order.setTotalAmount(totalAmount);
        order.setStatus(Order.OrderStatus.PENDING);
        order.setCustomerEmail(request.getCustomerEmail());
        order.setShippingAddress(request.getShippingAddress());

        for (OrderItemDTO itemDTO : request.getItems()) {
            OrderItem item = new OrderItem();
            item.setProductId(itemDTO.getProductId());
            item.setProductName(itemDTO.getProductName());
            item.setProductBrand(itemDTO.getProductBrand());
            item.setProductImageUrl(itemDTO.getProductImageUrl());
            item.setQuantity(itemDTO.getQuantity());
            item.setUnitPrice(itemDTO.getUnitPrice());
            BigDecimal subtotal = itemDTO.getUnitPrice().multiply(BigDecimal.valueOf(itemDTO.getQuantity()));
            item.setSubtotal(subtotal);
            order.addOrderItem(item);
        }

        Payment payment = new Payment();
        payment.setAmount(totalAmount);
        payment.setStatus(Payment.PaymentStatus.PENDING);
        payment.setOrder(order);
        order.setPayment(payment);

        Order savedOrder = orderRepository.save(order);

        webSocketService.notifyOrderUpdate(savedOrder);

        return savedOrder;
    }

    @Transactional
    public Order processSuccessfulPayment(String stripeSessionId, String paymentIntentId) {
        Order order = orderRepository.findByStripeSessionId(stripeSessionId)
                .orElseThrow(() -> new RuntimeException("Order not found for session: " + stripeSessionId));

        order.setStatus(Order.OrderStatus.PAID);
        
        Payment payment = order.getPayment();
        payment.setStatus(Payment.PaymentStatus.SUCCEEDED);
        payment.setStripePaymentIntentId(paymentIntentId);
        payment.setPaymentMethod("card");

        for (OrderItem item : order.getOrderItems()) {
            Product product = productRepository.findById(item.getProductId()).orElse(null);
            if (product != null) {
                int newStock = product.getStockQuantity() - item.getQuantity();
                product.setStockQuantity(Math.max(0, newStock));
                productRepository.save(product);
            }
        }

        Order savedOrder = orderRepository.save(order);

        webSocketService.notifyOrderUpdate(savedOrder);
        webSocketService.notifyPaymentUpdate(order.getId(), "PAID");

        return savedOrder;
    }

    @Transactional
    public Order processFailedPayment(String stripeSessionId) {
        Order order = orderRepository.findByStripeSessionId(stripeSessionId)
                .orElseThrow(() -> new RuntimeException("Order not found for session: " + stripeSessionId));

        order.setStatus(Order.OrderStatus.FAILED);
        
        Payment payment = order.getPayment();
        payment.setStatus(Payment.PaymentStatus.FAILED);

        Order savedOrder = orderRepository.save(order);

        webSocketService.notifyOrderUpdate(savedOrder);
        webSocketService.notifyPaymentUpdate(order.getId(), "FAILED");

        return savedOrder;
    }

    public Order getOrderById(Long id) {
        return orderRepository.findById(id).orElse(null);
    }

    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    public Order updateOrderStatus(Long orderId, Order.OrderStatus status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        
        order.setStatus(status);
        Order savedOrder = orderRepository.save(order);
        
        webSocketService.notifyOrderUpdate(savedOrder);
        
        return savedOrder;
    }

    public void updateOrderSessionId(Long orderId, String sessionId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        
        order.setStripeSessionId(sessionId);
        orderRepository.save(order);

        Payment payment = order.getPayment();
        payment.setStripeSessionId(sessionId);
        paymentRepository.save(payment);
    }
}
