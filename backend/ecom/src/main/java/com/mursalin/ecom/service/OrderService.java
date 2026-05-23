package com.mursalin.ecom.service;

import com.mursalin.ecom.dto.CreateOrderRequest;
import com.mursalin.ecom.dto.OrderItemDTO;
import com.mursalin.ecom.model.Order;
import com.mursalin.ecom.model.OrderItem;
import com.mursalin.ecom.model.Payment;
import com.mursalin.ecom.model.Product;
import com.mursalin.ecom.repository.OrderRepository;
import com.mursalin.ecom.repository.PaymentRepository;
import com.mursalin.ecom.repository.ProductRepo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class OrderService {

    private static final Logger logger = LoggerFactory.getLogger(OrderService.class);

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private ProductRepo productRepository;

    @Autowired
    private WebSocketService webSocketService;

    @Autowired
    private ShippingService shippingService;

    // -------------------------------------------------------------------------
    // CREATE ORDER
    // -------------------------------------------------------------------------

    @Transactional
    public Order createOrder(CreateOrderRequest request, Long userId, String customerEmail) {
        // 1. Calculate subtotal
        BigDecimal subtotal = request.getItems().stream()
                .map(item -> item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 2. Calculate shipping cost (country hardcoded BD for now)
        BigDecimal shippingCost = shippingService.calculateShippingCost(
                subtotal,
                request.getShippingMethod() != null ? request.getShippingMethod() : "STANDARD",
                "BD"
        );

        // 3. Total = subtotal + shipping
        BigDecimal totalAmount = subtotal.add(shippingCost);

        // 4. Build Order
        Order order = new Order();
        order.setCustomerEmail(customerEmail);
        order.setShippingAddress(request.getShippingAddress());
        order.setTotalAmount(totalAmount);
        order.setStatus(Order.OrderStatus.PENDING);
        order.setUserId(userId);
        order.setShippingCost(shippingCost);
        order.setShippingMethod(request.getShippingMethod());

        // 5. Build OrderItems
        for (OrderItemDTO itemDTO : request.getItems()) {
            OrderItem item = new OrderItem();
            item.setProductId(itemDTO.getProductId());
            item.setProductName(itemDTO.getProductName());
            item.setProductBrand(itemDTO.getProductBrand());
            item.setProductImageUrl(itemDTO.getProductImageUrl());
            item.setQuantity(itemDTO.getQuantity());
            item.setUnitPrice(itemDTO.getUnitPrice());
            item.setSubtotal(itemDTO.getUnitPrice().multiply(BigDecimal.valueOf(itemDTO.getQuantity())));
            order.addOrderItem(item);
        }

        // 4. Build Payment (PENDING)
        Payment payment = new Payment();
        payment.setOrder(order);
        payment.setAmount(totalAmount);
        payment.setStatus(Payment.PaymentStatus.PENDING);
        order.setPayment(payment);

        // 5. Save (cascades to items and payment)
        Order savedOrder = orderRepository.save(order);
        logger.info("Created order id={} status=PENDING total={} shipping={} method={}",
                savedOrder.getId(), totalAmount, shippingCost, request.getShippingMethod());

        // 6. WebSocket notification
        webSocketService.notifyOrderUpdate(savedOrder);

        return savedOrder;
    }

    // -------------------------------------------------------------------------
    // PROCESS SUCCESSFUL PAYMENT (primary: by session ID)
    // -------------------------------------------------------------------------

    @Transactional
    public Order processSuccessfulPayment(String stripeSessionId, String paymentIntentId) {
        Order order = orderRepository.findByStripeSessionId(stripeSessionId)
                .orElseThrow(() -> {
                    logger.error("Order not found for stripeSessionId={}", stripeSessionId);
                    return new RuntimeException("Order not found for session ID: " + stripeSessionId);
                });

        String oldStatus = order.getStatus().name();

        // 2. Update order status
        order.setStatus(Order.OrderStatus.PAID);
        order.setStripePaymentIntentId(paymentIntentId);

        // 3. Update payment
        Payment payment = order.getPayment();
        payment.setStatus(Payment.PaymentStatus.SUCCEEDED);
        payment.setStripePaymentIntentId(paymentIntentId);
        payment.setPaymentMethod("card");

        // 4. Reduce stock
        reduceStock(order);

        // 5. Save
        Order savedOrder = orderRepository.save(order);
        logger.info("Payment succeeded for orderId={}, sessionId={}", savedOrder.getId(), stripeSessionId);

        // 6. WebSocket notifications
        webSocketService.notifyOrderUpdate(savedOrder);
        webSocketService.notifyPaymentUpdate(savedOrder.getId(), "SUCCEEDED");
        webSocketService.notifyOrderStatusChange(savedOrder.getId(), oldStatus, Order.OrderStatus.PAID.name());

        return savedOrder;
    }

    // -------------------------------------------------------------------------
    // PROCESS FAILED PAYMENT
    // -------------------------------------------------------------------------

    @Transactional
    public Order processFailedPayment(String stripeSessionId) {
        Order order = orderRepository.findByStripeSessionId(stripeSessionId)
                .orElseThrow(() -> {
                    logger.error("Order not found for stripeSessionId={}", stripeSessionId);
                    return new RuntimeException("Order not found for session ID: " + stripeSessionId);
                });

        String oldStatus = order.getStatus().name();

        order.setStatus(Order.OrderStatus.FAILED);

        Payment payment = order.getPayment();
        payment.setStatus(Payment.PaymentStatus.FAILED);

        Order savedOrder = orderRepository.save(order);
        logger.info("Payment failed for orderId={}, sessionId={}", savedOrder.getId(), stripeSessionId);

        webSocketService.notifyOrderUpdate(savedOrder);
        webSocketService.notifyPaymentUpdate(savedOrder.getId(), "FAILED");
        webSocketService.notifyOrderStatusChange(savedOrder.getId(), oldStatus, Order.OrderStatus.FAILED.name());

        return savedOrder;
    }

    // -------------------------------------------------------------------------
    // PROCESS SUCCESSFUL PAYMENT (fallback: by payment intent ID)
    // -------------------------------------------------------------------------

    @Transactional
    public Order processSuccessfulPaymentByIntentId(String paymentIntentId) {
        Payment payment = paymentRepository.findByStripePaymentIntentId(paymentIntentId)
                .orElseThrow(() -> {
                    logger.error("Payment not found for paymentIntentId={}", paymentIntentId);
                    return new RuntimeException("Payment not found for intent ID: " + paymentIntentId);
                });

        Order order = payment.getOrder();

        // Idempotency check
        if (order.getStatus() == Order.OrderStatus.PAID) {
            logger.info("Order id={} already PAID — skipping duplicate event for intentId={}", order.getId(), paymentIntentId);
            return order;
        }

        String oldStatus = order.getStatus().name();

        order.setStatus(Order.OrderStatus.PAID);
        order.setStripePaymentIntentId(paymentIntentId);

        payment.setStatus(Payment.PaymentStatus.SUCCEEDED);
        payment.setPaymentMethod("card");

        reduceStock(order);

        Order savedOrder = orderRepository.save(order);
        logger.info("Payment succeeded (fallback path) for orderId={}, intentId={}", savedOrder.getId(), paymentIntentId);

        webSocketService.notifyOrderUpdate(savedOrder);
        webSocketService.notifyPaymentUpdate(savedOrder.getId(), "SUCCEEDED");
        webSocketService.notifyOrderStatusChange(savedOrder.getId(), oldStatus, Order.OrderStatus.PAID.name());

        return savedOrder;
    }

    // -------------------------------------------------------------------------
    // UPDATE ORDER WITH SESSION ID (called after Stripe session creation)
    // -------------------------------------------------------------------------

    @Transactional
    public void updateOrderSessionId(Long orderId, String sessionId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));

        order.setStripeSessionId(sessionId);
        orderRepository.save(order);

        Payment payment = order.getPayment();
        if (payment != null) {
            payment.setStripeSessionId(sessionId);
            paymentRepository.save(payment);
        }

        logger.info("Updated orderId={} with stripeSessionId={}", orderId, sessionId);
    }

    // -------------------------------------------------------------------------
    // CRUD
    // -------------------------------------------------------------------------

    public Order getOrderById(Long id) {
        return orderRepository.findById(id).orElse(null);
    }

    public Order getOrderByIdForUser(Long id, Long userId) {
        Order order = orderRepository.findById(id).orElse(null);
        if (order == null) {
            return null;
        }
        // Verify ownership
        if (!order.getUserId().equals(userId)) {
            throw new AccessDeniedException("Not authorized to access this order");
        }
        return order;
    }

    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    public List<Order> getOrdersByUserId(Long userId) {
        return orderRepository.findByUserId(userId);
    }

    @Transactional
    public Order updateOrderStatus(Long orderId, Order.OrderStatus status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));

        String oldStatus = order.getStatus().name();
        order.setStatus(status);
        Order savedOrder = orderRepository.save(order);

        logger.info("Admin status update: orderId={}, {} -> {}", orderId, oldStatus, status);
        webSocketService.notifyOrderUpdate(savedOrder);
        webSocketService.notifyOrderStatusChange(orderId, oldStatus, status.name());

        return savedOrder;
    }

    // -------------------------------------------------------------------------
    // PRIVATE HELPERS
    // -------------------------------------------------------------------------

    private void reduceStock(Order order) {
        for (OrderItem item : order.getOrderItems()) {
            productRepository.findById(item.getProductId()).ifPresent(product -> {
                int newStock = Math.max(0, product.getStockQuantity() - item.getQuantity());
                product.setStockQuantity(newStock);
                productRepository.save(product);
                logger.info("Reduced stock for productId={}: {} -> {}", product.getId(), product.getStockQuantity() + item.getQuantity(), newStock);
            });
        }
    }
}
