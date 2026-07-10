package com.mursalin.ecom.controller;

import com.mursalin.ecom.dto.CheckoutSessionResponse;
import com.mursalin.ecom.dto.CreateOrderRequest;
import com.mursalin.ecom.model.UserPrinciples;
import com.mursalin.ecom.service.OrderService;
import com.mursalin.ecom.service.StripeService;
import com.stripe.exception.StripeException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/payment")
@PreAuthorize("hasRole('USER')")
public class PaymentController {

    private static final Logger logger = LoggerFactory.getLogger(PaymentController.class);

    private final OrderService orderService;
    private final StripeService stripeService;

    public PaymentController(OrderService orderService, StripeService stripeService) {
        this.orderService = orderService;
        this.stripeService = stripeService;
    }

    @PostMapping("/create-checkout-session")
    public ResponseEntity<CheckoutSessionResponse> createCheckoutSession(
            @RequestBody CreateOrderRequest request,
            @AuthenticationPrincipal UserPrinciples userPrinciple
    ) {
        try {
            String customerEmail = userPrinciple.getUsername();

            var order = orderService.createOrder(request, userPrinciple.getUserId(), customerEmail);

            BigDecimal shippingCost = request.getShippingCost() != null ? request.getShippingCost() : BigDecimal.ZERO;
            String shippingMethod = request.getShippingMethod() != null ? request.getShippingMethod() : "STANDARD";

            CheckoutSessionResponse response = stripeService.createCheckoutSession(
                    request.getItems(),
                    order.getId(),
                    customerEmail,
                    shippingCost,
                    shippingMethod
            );

            orderService.updateOrderSessionId(order.getId(), response.getSessionId());

            logger.info("Checkout session created: sessionId={}, orderId={}", response.getSessionId(), order.getId());

            return ResponseEntity.ok(response);

        } catch (StripeException e) {
            logger.error("Stripe error while creating checkout session: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        } catch (Exception e) {
            logger.error("Unexpected error while creating checkout session: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/session/{sessionId}")
    public ResponseEntity<CheckoutSessionResponse> getSessionStatus(
            @PathVariable String sessionId
    ) {
        try {
            CheckoutSessionResponse response = stripeService.getSessionStatus(sessionId);
            return ResponseEntity.ok(response);
        } catch (StripeException e) {
            logger.error("Session not found or Stripe error for sessionId={}: {}", sessionId, e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }
}
