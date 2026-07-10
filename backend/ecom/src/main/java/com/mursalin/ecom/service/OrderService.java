package com.mursalin.ecom.service;

import com.mursalin.ecom.dto.*;
import com.mursalin.ecom.model.*;
import com.mursalin.ecom.repository.*;
import com.mursalin.ecom.exception.ResourceNotFoundException;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Service
@RequiredArgsConstructor
public class OrderService {

    private static final Logger logger = LoggerFactory.getLogger(OrderService.class);
    private static final BigDecimal TAX_RATE = new BigDecimal("0.18");
    private static final BigDecimal SHIPPING_FREE_THRESHOLD = new BigDecimal("500");
    private static final BigDecimal SHIPPING_FLAT_FEE = new BigDecimal("50");

    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final ProductRepo productRepository;
    private final CartItemRepository cartItemRepository;
    private final CouponRepository couponRepository;
    private final UserRepository userRepository;
    private final WebSocketService webSocketService;

    @Value("${stripe.secret.key}")
    private String stripeSecretKey;

    // -------------------------------------------------------------------------
    // LEGACY: createOrder (existing PaymentController flow)
    // -------------------------------------------------------------------------

    @Transactional
    public Order createOrder(CreateOrderRequest request, Long userId, String customerEmail) {
        BigDecimal subtotal = calcSubtotal(request.getItems());
        BigDecimal shippingCost = request.getShippingCost() != null ? request.getShippingCost() :
                (subtotal.compareTo(SHIPPING_FREE_THRESHOLD) >= 0 ? BigDecimal.ZERO : SHIPPING_FLAT_FEE);
        BigDecimal discountAmount = request.getDiscountAmount() != null ? request.getDiscountAmount() : BigDecimal.ZERO;
        BigDecimal taxAmount = subtotal.multiply(TAX_RATE).setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalAmount = subAddAll(subtotal, shippingCost, taxAmount, discountAmount.negate());

        Order order = new Order();
        setOrderUser(order, userId);
        order.setCustomerEmail(customerEmail);
        order.setSubtotal(subtotal);
        order.setDiscountAmount(discountAmount);
        order.setTaxAmount(taxAmount);
        order.setShippingFee(shippingCost);
        order.setShippingMethod(request.getShippingMethod());
        order.setTotalAmount(totalAmount);
        order.setStatus(Order.OrderStatus.PENDING);

        attachCoupon(order, request.getCouponCode());
        buildOrderItems(order, request.getItems());
        buildPayment(order, totalAmount);

        order = orderRepository.save(order);
        logger.info("Legacy order created id={} total={}", order.getId(), totalAmount);
        webSocketService.notifyOrderUpdate(order);
        return order;
    }

    // -------------------------------------------------------------------------
    // PROMPT 19: initiateOrder — creates PENDING order + PaymentIntent
    // -------------------------------------------------------------------------

    @Transactional
    public InitiateOrderResponse initiateOrder(InitiateOrderRequest request, Long userId, String customerEmail) {
        AddressSnapshot snapshot = buildSnapshot(request);

        BigDecimal subtotal = cartSubtotal(userId);
        if (subtotal.compareTo(BigDecimal.ZERO) == 0) throw new RuntimeException("Your cart is empty");

        Coupon appliedCoupon = null;
        BigDecimal discountAmount = BigDecimal.ZERO;
        String couponCode = blankToNull(request.getCouponCode());

        if (couponCode != null) {
            appliedCoupon = couponRepository.findByCodeAndIsActiveTrue(couponCode).orElse(null);
            if (appliedCoupon == null) throw new RuntimeException("Invalid or expired coupon code");
            if (appliedCoupon.getExpiresAt() != null && appliedCoupon.getExpiresAt().isBefore(java.time.LocalDateTime.now()))
                throw new RuntimeException("Invalid or expired coupon code");
            if (appliedCoupon.getMaxUses() != null && appliedCoupon.getUsesCount() >= appliedCoupon.getMaxUses())
                throw new RuntimeException("Invalid or expired coupon code");
            if (appliedCoupon.getMinOrderValue() != null && subtotal.compareTo(appliedCoupon.getMinOrderValue()) < 0)
                throw new RuntimeException("Minimum order value of ₹" + appliedCoupon.getMinOrderValue() + " required");
            if (appliedCoupon.getDiscountType() == DiscountType.PERCENT) {
                discountAmount = subtotal.multiply(appliedCoupon.getDiscountValue())
                        .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            } else {
                discountAmount = appliedCoupon.getDiscountValue();
                if (discountAmount.compareTo(subtotal) > 0) discountAmount = subtotal;
            }
        }

        BigDecimal shippingFee = subtotal.compareTo(SHIPPING_FREE_THRESHOLD) >= 0 ? BigDecimal.ZERO : SHIPPING_FLAT_FEE;
        BigDecimal taxAmount = subtotal.multiply(TAX_RATE).setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalAmount = subAddAll(subtotal, shippingFee, taxAmount, discountAmount.negate());
        String shippingMethod = blankToNull(request.getShippingMethod()) != null ? request.getShippingMethod() : "STANDARD";

        // Idempotency: reuse existing PENDING order with same total
        Optional<Order> existingOpt = orderRepository.findByUserId(userId).stream()
                .filter(o -> o.getStatus() == Order.OrderStatus.PENDING)
                .filter(o -> o.getTotalAmount().compareTo(totalAmount) == 0)
                .findFirst();

        PaymentIntent intent;
        String clientSecret;
        try {
            Stripe.apiKey = stripeSecretKey;
            PaymentIntentCreateParams p = PaymentIntentCreateParams.builder()
                    .setAmount(totalAmount.multiply(BigDecimal.valueOf(100)).longValue())
                    .setCurrency("inr")
                    .setAutomaticPaymentMethods(PaymentIntentCreateParams.AutomaticPaymentMethods.builder().setEnabled(true).build())
                    .putMetadata("user_id", userId.toString())
                    .build();
            intent = PaymentIntent.create(p);
            clientSecret = intent.getClientSecret();
        } catch (StripeException e) {
            logger.error("Stripe PaymentIntent failed: {}", e.getMessage());
            throw new RuntimeException("Payment initialization failed: " + e.getMessage());
        }

        Order order;
        if (existingOpt.isPresent()) {
            order = existingOpt.get();
            order.setStripePaymentIntentId(intent.getId());
            orderRepository.save(order);
            logger.info("Idempotent: reusing orderId={} userId={}", order.getId(), userId);
        } else {
            order = new Order();
            setOrderUser(order, userId);
            order.setCustomerEmail(customerEmail);
            order.setSubtotal(subtotal);
            order.setDiscountAmount(discountAmount);
            order.setTaxAmount(taxAmount);
            order.setShippingFee(shippingFee);
            order.setShippingMethod(shippingMethod);
            order.setTotalAmount(totalAmount);
            order.setStatus(Order.OrderStatus.PENDING);
            order.setDeliveryAddress(snapshot);
            order.setStripePaymentIntentId(intent.getId());

            if (appliedCoupon != null) order.setCoupon(appliedCoupon);

            attachCartItems(order, userId);
            buildPayment(order, totalAmount);
            order = orderRepository.save(order);
            logger.info("Initiated order id={} userId={} total={} intent={}",
                    order.getId(), userId, totalAmount, intent.getId());
        }

        LocalDate estDelivery = LocalDate.now().plusDays(5);
        int itemCount = order.getOrderItems().size();
        List<com.mursalin.ecom.dto.OrderItemDTO> itemDTOs = order.getOrderItems().stream()
                .map(OrderItemDTO::fromOrderItem).toList();

        InitiateOrderResponse.OrderSummary summary = new InitiateOrderResponse.OrderSummary(
                order.getId(), order.getStatus().name(),
                subtotal, discountAmount, taxAmount, shippingFee, totalAmount,
                itemCount, estDelivery.toString(), itemDTOs
        );
        return new InitiateOrderResponse(order.getId(), clientSecret, summary);
    }

    // -------------------------------------------------------------------------
    // PROMPT 19: confirmOrder
    // -------------------------------------------------------------------------

    @Transactional
    public InitiateOrderResponse confirmOrder(Long orderId, String paymentIntentId, Long userId) {
        Stripe.apiKey = stripeSecretKey;
        PaymentIntent intent;
        try { intent = PaymentIntent.retrieve(paymentIntentId); }
        catch (com.stripe.exception.StripeException e) { throw new RuntimeException("Payment not found: " + paymentIntentId); }

        if (!"succeeded".equals(intent.getStatus()))
            throw new RuntimeException("Payment not yet succeeded. Status: " + intent.getStatus());

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));
        if (!order.getUser().getUserId().equals(userId))
            throw new AccessDeniedException("Not authorized to confirm this order");

        String oldStatus = order.getStatus().name();

        // Idempotency
        if (order.getStatus() == Order.OrderStatus.CONFIRMED) {
            logger.info("Order id={} already CONFIRMED", orderId);
            return buildSummary(order);
        }
        if (order.getStatus() != Order.OrderStatus.PENDING)
            throw new RuntimeException("Order cannot be confirmed from status: " + order.getStatus());

        order.setStatus(Order.OrderStatus.CONFIRMED);
        order.setStripePaymentIntentId(paymentIntentId);

        Payment payment = order.getPayment();
        if (payment != null) {
            payment.setStatus(Payment.PaymentStatus.SUCCEEDED);
            payment.setStripePaymentIntentId(paymentIntentId);
            payment.setPaymentMethod("card");
            paymentRepository.save(payment);
        }

        if (order.getCoupon() != null) {
            Coupon c = order.getCoupon();
            c.setUsesCount(c.getUsesCount() + 1);
            couponRepository.save(c);
        }

        reduceStock(order);
        clearUserCart(userId);

        OrderStatusHistory history = new OrderStatusHistory();
        history.setOrder(order);
        history.setOldStatus(oldStatus);
        history.setNewStatus(Order.OrderStatus.CONFIRMED.name());
        history.setChangedBy(order.getUser());
        history.setNote("Payment confirmed via Stripe");
        history.setChangedAt(java.time.LocalDateTime.now());
        order.addStatusHistory(history);

        Order saved = orderRepository.save(order);
        webSocketService.notifyOrderUpdate(saved);
        webSocketService.notifyOrderStatusChange(saved.getId(), oldStatus, Order.OrderStatus.CONFIRMED.name());
        logger.info("Confirmed order id={} userId={} intent={}", orderId, userId, paymentIntentId);
        return buildSummary(saved);
    }

    // -------------------------------------------------------------------------
    // LEGACY STRIPE WEBHOOK HELPERS (preserved)
    // -------------------------------------------------------------------------

    @Transactional
    public Order processSuccessfulPayment(String stripeSessionId, String paymentIntentId) {
        Order order = orderRepository.findByStripeSessionId(stripeSessionId)
                .orElseThrow(() -> new RuntimeException("Order not found for session: " + stripeSessionId));
        String oldStatus = order.getStatus().name();
        order.setStatus(Order.OrderStatus.CONFIRMED);
        order.setStripePaymentIntentId(paymentIntentId);
        Payment payment = order.getPayment();
        payment.setStatus(Payment.PaymentStatus.SUCCEEDED);
        payment.setStripePaymentIntentId(paymentIntentId);
        payment.setPaymentMethod("card");
        reduceStock(order);
        if (order.getCoupon() != null) {
            Coupon c = order.getCoupon(); c.setUsesCount(c.getUsesCount() + 1); couponRepository.save(c);
        }
        Order saved = orderRepository.save(order);
        webSocketService.notifyOrderUpdate(saved);
        webSocketService.notifyPaymentUpdate(saved.getId(), "SUCCEEDED");
        webSocketService.notifyOrderStatusChange(saved.getId(), oldStatus, Order.OrderStatus.CONFIRMED.name());
        return saved;
    }

    @Transactional
    public Order processFailedPayment(String stripeSessionId) {
        Order order = orderRepository.findByStripeSessionId(stripeSessionId)
                .orElseThrow(() -> new RuntimeException("Order not found for session: " + stripeSessionId));
        String oldStatus = order.getStatus().name();
        order.setStatus(Order.OrderStatus.FAILED);
        Payment payment = order.getPayment();
        payment.setStatus(Payment.PaymentStatus.FAILED);
        Order saved = orderRepository.save(order);
        webSocketService.notifyOrderUpdate(saved);
        webSocketService.notifyPaymentUpdate(saved.getId(), "FAILED");
        webSocketService.notifyOrderStatusChange(saved.getId(), oldStatus, Order.OrderStatus.FAILED.name());
        return saved;
    }

    @Transactional
    public Order processSuccessfulPaymentByIntentId(String paymentIntentId) {
        Order order = orderRepository
                .findByStripePaymentIntentId(paymentIntentId)
                .orElseThrow(() -> new RuntimeException("Order not found for intent: " + paymentIntentId));
        if (order.getStatus() == Order.OrderStatus.CONFIRMED) {
            logger.info("Order id={} already CONFIRMED, skipping webhook", order.getId());
            return order;
        }
        Payment payment = order.getPayment();
        String oldStatus = order.getStatus().name();
        order.setStatus(Order.OrderStatus.CONFIRMED);
        order.setStripePaymentIntentId(paymentIntentId);
        payment.setStatus(Payment.PaymentStatus.SUCCEEDED);
        payment.setPaymentMethod("card");
        reduceStock(order);
        if (order.getCoupon() != null) {
            Coupon c = order.getCoupon(); c.setUsesCount(c.getUsesCount() + 1); couponRepository.save(c);
        }
        clearUserCart(order.getUser().getUserId());
        Order saved = orderRepository.save(order);
        webSocketService.notifyOrderUpdate(saved);
        webSocketService.notifyPaymentUpdate(saved.getId(), "SUCCEEDED");
        webSocketService.notifyOrderStatusChange(saved.getId(), oldStatus, Order.OrderStatus.CONFIRMED.name());
        return saved;
    }

    @Transactional
    public void updateOrderSessionId(Long orderId, String sessionId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));
        order.setStripeSessionId(sessionId);
        orderRepository.save(order);
        Payment payment = order.getPayment();
        if (payment != null) { payment.setStripeSessionId(sessionId); paymentRepository.save(payment); }
        logger.info("Linked sessionId={} to orderId={}", sessionId, orderId);
    }

    // -------------------------------------------------------------------------
    // CRUD
    // -------------------------------------------------------------------------

    public Order getOrderById(Long id) { return orderRepository.findById(id).orElse(null); }

    public Order getOrderByIdForUser(Long id, Long userId) {
        Order order = orderRepository.findById(id).orElse(null);
        if (order == null) return null;
        if (!order.getUser().getUserId().equals(userId)) throw new AccessDeniedException("Not authorized");
        return order;
    }

    public PaginatedResponse<OrderSummaryDTO> getOrdersByUserId(Long userId, Pageable pageable) {
        Page<Order> orderPage = orderRepository.findByUserId(userId, pageable);
        List<OrderSummaryDTO> content = orderPage.getContent().stream()
                .map(this::toOrderSummaryDTO)
                .toList();
        return new PaginatedResponse<>(content, pageable.getPageNumber(), orderPage.getTotalPages(),
                orderPage.getTotalElements(), pageable.getPageSize(), !orderPage.hasPrevious(), !orderPage.hasNext());
    }

    public PaginatedResponse<OrderSummaryDTO> getAllOrders(Pageable pageable) {
        Page<Order> orderPage = orderRepository.findAll(pageable);
        List<OrderSummaryDTO> content = orderPage.getContent().stream()
                .map(this::toOrderSummaryDTO)
                .toList();
        return new PaginatedResponse<>(content, pageable.getPageNumber(), orderPage.getTotalPages(),
                orderPage.getTotalElements(), pageable.getPageSize(), !orderPage.hasPrevious(), !orderPage.hasNext());
    }

    public PaginatedResponse<OrderSummaryDTO> getOrdersByUserIdAndStatus(Long userId, Order.OrderStatus status, Pageable pageable) {
        Page<Order> orderPage = orderRepository.findByUserIdAndStatus(userId, status, pageable);
                List<OrderSummaryDTO> content = orderPage.getContent().stream()
                .map(this::toOrderSummaryDTO)
                .toList();
        return new PaginatedResponse<>(content, pageable.getPageNumber(), orderPage.getTotalPages(),
                orderPage.getTotalElements(), pageable.getPageSize(), !orderPage.hasPrevious(), !orderPage.hasNext());
    }

    public PaginatedResponse<OrderSummaryDTO> getAllOrdersByStatus(Order.OrderStatus status, Pageable pageable) {
        Page<Order> orderPage = orderRepository.findByStatus(status, pageable);
        List<OrderSummaryDTO> content = orderPage.getContent().stream()
                .map(this::toOrderSummaryDTO)
                .toList();
        return new PaginatedResponse<>(content, pageable.getPageNumber(), orderPage.getTotalPages(),
                orderPage.getTotalElements(), pageable.getPageSize(), !orderPage.hasPrevious(), !orderPage.hasNext());

    }

    @Transactional
    public Order cancelOrder(Long orderId, Long userId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));
        if (!order.getUser().getUserId().equals(userId)) {
            throw new AccessDeniedException("Not authorized to cancel this order");
        }
        Order.OrderStatus currentStatus = order.getStatus();
        if (currentStatus != Order.OrderStatus.PENDING && currentStatus != Order.OrderStatus.CONFIRMED) {
            throw new RuntimeException("Order cannot be cancelled from status: " + currentStatus);
        }

        String oldStatus = currentStatus.name();
        Order.OrderStatus newStatus = currentStatus == Order.OrderStatus.PENDING
                ? Order.OrderStatus.CANCELLED
                : Order.OrderStatus.REFUND_REQUESTED;

        order.setStatus(newStatus);
        OrderStatusHistory history = new OrderStatusHistory();
        history.setOrder(order);
        history.setOldStatus(oldStatus);
        history.setNewStatus(newStatus.name());
        history.setChangedBy(order.getUser());
        history.setNote("Cancelled by customer");
        history.setChangedAt(LocalDateTime.now());
        order.addStatusHistory(history);

        Order saved = orderRepository.save(order);
        webSocketService.notifyOrderUpdate(saved);
        webSocketService.notifyOrderStatusChange(orderId, oldStatus, newStatus.name());
        logger.info("User cancelled order id={}, {} -> {}", orderId, oldStatus, newStatus);
        return saved;
    }

    @Transactional
    public OrderStatusUpdateResponse updateOrderStatus(Long orderId, Order.OrderStatus status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));
        String oldStatus = order.getStatus().name();
        order.setStatus(status);
        OrderStatusHistory history = new OrderStatusHistory();
        history.setOrder(order);
        history.setOldStatus(oldStatus);
        history.setNewStatus(status.name());
        history.setChangedBy(null);
        history.setChangedAt(java.time.LocalDateTime.now());
        order.addStatusHistory(history);
        Order saved = orderRepository.save(order);
        logger.info("Admin status update: orderId={}, {} -> {}", orderId, oldStatus, status);
        webSocketService.notifyOrderUpdate(saved);
        webSocketService.notifyOrderStatusChange(orderId, oldStatus, status.name());
        return OrderStatusUpdateResponse.fromEntity(saved);
    }

    @Transactional
    public Order adminUpdateOrderStatus(Long orderId, Order.OrderStatus newStatus, String note, String trackingNumber, String courierName, Long adminUserId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));
        Order.OrderStatus oldStatus = order.getStatus();

        if (!isValidTransition(oldStatus, newStatus)) {
            throw new RuntimeException("Invalid status transition from " + oldStatus + " to " + newStatus);
        }

        if (newStatus == Order.OrderStatus.SHIPPED) {
            if (trackingNumber == null || trackingNumber.isBlank() || courierName == null || courierName.isBlank()) {
                throw new RuntimeException("Tracking number and courier name are required when marking as shipped");
            }
            order.setTrackingNumber(trackingNumber);
            order.setShippingCarrier(courierName);
        }

        order.setStatus(newStatus);

        User admin = userRepository.findById(adminUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + adminUserId));

        OrderStatusHistory history = new OrderStatusHistory();
        history.setOrder(order);
        history.setOldStatus(oldStatus.name());
        history.setNewStatus(newStatus.name());
        history.setChangedBy(admin);
        history.setNote(note);
        history.setChangedAt(java.time.LocalDateTime.now());
        order.addStatusHistory(history);

        Order saved = orderRepository.save(order);
        logger.info("Admin status update: orderId={}, {} -> {}", orderId, oldStatus, newStatus);
        webSocketService.notifyOrderUpdate(saved);
        webSocketService.notifyOrderStatusChange(orderId, oldStatus.name(), newStatus.name());
        return saved;
    }

    private boolean isValidTransition(Order.OrderStatus from, Order.OrderStatus to) {
        if (from == Order.OrderStatus.PENDING && (to == Order.OrderStatus.CONFIRMED || to == Order.OrderStatus.CANCELLED)) return true;
        if (from == Order.OrderStatus.CONFIRMED && (to == Order.OrderStatus.SHIPPED || to == Order.OrderStatus.CANCELLED)) return true;
        if (from == Order.OrderStatus.SHIPPED && to == Order.OrderStatus.DELIVERED) return true;
        if (from == Order.OrderStatus.DELIVERED && to == Order.OrderStatus.REFUND_PROCESSING) return true;
        if (from == Order.OrderStatus.REFUND_PROCESSING && to == Order.OrderStatus.REFUNDED) return true;
        return false;
    }

    @Transactional
    public com.mursalin.ecom.dto.OrderStatusUpdateResponse updateOrderTracking(Long orderId, String trackingNumber, String trackingUrl, String shippingCarrier) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));
        order.setTrackingNumber(trackingNumber);
        order.setTrackingUrl(trackingUrl);
        order.setShippingCarrier(shippingCarrier);
        Order saved = orderRepository.save(order);
        logger.info("Tracking updated orderId={} trackingNumber={}", orderId, trackingNumber);
        webSocketService.notifyOrderUpdate(saved);
        return com.mursalin.ecom.dto.OrderStatusUpdateResponse.fromEntity(saved);
    }

    // -------------------------------------------------------------------------
    // PRIVATE HELPERS
    // -------------------------------------------------------------------------

    private void setOrderUser(Order order, Long userId) {
        User u = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        order.setUser(u);
    }

    private BigDecimal calcSubtotal(List<OrderItemDTO> items) {
        BigDecimal sum = BigDecimal.ZERO;
        for (OrderItemDTO i : items) sum = sum.add(i.getUnitPrice().multiply(BigDecimal.valueOf(i.getQuantity())));
        return sum;
    }

    private BigDecimal cartSubtotal(Long userId) {
        BigDecimal sum = BigDecimal.ZERO;
        for (CartItem ci : cartItemRepository.findByUserId(userId))
            sum = sum.add(ci.getProduct().getPrice().multiply(BigDecimal.valueOf(ci.getQuantity())));
        return sum;
    }

    private BigDecimal subAddAll(BigDecimal a, BigDecimal b, BigDecimal c, BigDecimal d) {
        BigDecimal r = a.add(b).add(c).add(d);
        return r.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : r;
    }

    private static String blankToNull(String s) { return (s == null || s.isBlank()) ? null : s; }

    private void attachCoupon(Order order, String couponCode) {
        String code = blankToNull(couponCode);
        if (code != null) couponRepository.findByCodeAndIsActiveTrue(code).ifPresent(order::setCoupon);
    }

    private void buildOrderItems(Order order, List<OrderItemDTO> items) {
        for (OrderItemDTO dto : items) {
            OrderItem oi = new OrderItem();
            oi.setProductId(dto.getProductId());
            oi.setProductName(dto.getProductName());
            oi.setProductBrand(dto.getProductBrand());
            oi.setProductImageUrl(dto.getProductImageUrl());
            oi.setQuantity(dto.getQuantity());
            oi.setUnitPrice(dto.getUnitPrice());
            oi.setSubtotal(dto.getUnitPrice().multiply(BigDecimal.valueOf(dto.getQuantity())));
            order.addOrderItem(oi);
        }
    }

    private void attachCartItems(Order order, Long userId) {
        for (CartItem ci : cartItemRepository.findByUserId(userId)) {
            Product p = ci.getProduct();
            OrderItem oi = new OrderItem();
            oi.setProductId(p.getId());
            oi.setProductName(p.getName());
            oi.setProductBrand(p.getBrandEntity() != null ? p.getBrandEntity().getName() : null);
            oi.setProductImageUrl(p.getImageUrl());
            oi.setQuantity(ci.getQuantity());
            oi.setUnitPrice(p.getPrice());
            oi.setSubtotal(p.getPrice().multiply(BigDecimal.valueOf(ci.getQuantity())));
            order.addOrderItem(oi);
        }
    }

    private void buildPayment(Order order, BigDecimal amount) {
        Payment payment = new Payment();
        payment.setOrder(order);
        payment.setAmount(amount);
        payment.setCurrency("inr");
        payment.setStatus(Payment.PaymentStatus.PENDING);
        payment.setPaymentMethod("stripe");
        order.setPayment(payment);
    }

    private AddressSnapshot buildSnapshot(InitiateOrderRequest request) {
        AddressSnapshot s = new AddressSnapshot();
        InitiateOrderRequest.AddressSnapshotRequest r = request.getAddressSnapshot();
        if (r != null) {
            s.setFullName(r.getFullName()); s.setPhone(r.getPhone());
            s.setLine1(r.getLine1()); s.setLine2(r.getLine2());
            s.setCity(r.getCity()); s.setState(r.getState());
            s.setPinCode(r.getPinCode());
            s.setCountry(r.getCountry() != null ? r.getCountry() : "India");
        }
        return s;
    }

    private void reduceStock(Order order) {
        for (OrderItem item : order.getOrderItems()) {
            productRepository.findById(item.getProductId()).ifPresent(product -> {
                int itemQty = item.getQuantity() != null ? item.getQuantity() : 0;
                Long currentStock = product.getStockQuantity() != null ? product.getStockQuantity() : 0L;
                long newStock = Math.max(0L, currentStock - itemQty);
                product.setStockQuantity(newStock);
                productRepository.save(product);
                logger.info("Reduced stock productId={}: {} -> {}", product.getId(),
                        currentStock, newStock);
            });
        }
    }

    private void clearUserCart(Long userId) {
        List<CartItem> items = cartItemRepository.findByUserId(userId);
        if (!items.isEmpty()) { cartItemRepository.deleteAll(items);
            logger.info("Cleared {} cart items for userId={}", items.size(), userId);
        }
    }

    private InitiateOrderResponse buildSummary(Order order) {
        LocalDate est = LocalDate.now().plusDays(5);
        int itemCount = order.getOrderItems().size();
        List<com.mursalin.ecom.dto.OrderItemDTO> dtos = order.getOrderItems().stream()
                .map(OrderItemDTO::fromOrderItem).toList();
        InitiateOrderResponse.OrderSummary summary = new InitiateOrderResponse.OrderSummary(
                order.getId(), order.getStatus().name(),
                order.getSubtotal(), order.getDiscountAmount(), order.getTaxAmount(),
                order.getShippingFee(), order.getTotalAmount(),
                itemCount, est.toString(), dtos
        );
        return new InitiateOrderResponse(order.getId(), order.getStripePaymentIntentId(), summary);
    }

    public OrderSummaryDTO toOrderSummaryDTO(Order order) {
        List<OrderSummaryItemDTO> items = order.getOrderItems().stream()
                .map(OrderSummaryItemDTO::fromOrderItem)
                .toList();
        return new OrderSummaryDTO(
                order.getId(),
                order.getCreatedAt(),
                items.size(),
                order.getTotalAmount(),
                order.getStatus().name(),
                items
        );
    }
}
