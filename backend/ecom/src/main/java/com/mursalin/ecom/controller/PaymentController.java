package com.mursalin.ecom.controller;

import com.mursalin.ecom.dto.CheckoutSessionResponse;
import com.mursalin.ecom.dto.CreateOrderRequest;
import com.mursalin.ecom.model.Order;
import com.mursalin.ecom.model.UserPrinciples;
import com.mursalin.ecom.service.OrderService;
import com.mursalin.ecom.service.StripeService;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payment")
@CrossOrigin
@PreAuthorize("hasRole('USER')")
public class PaymentController {

    private static final Logger logger = LoggerFactory.getLogger(PaymentController.class);

    @Autowired
    private OrderService orderService;

    @Autowired
    private StripeService stripeService;

    @PostMapping("/create-checkout-session")
    public ResponseEntity<CheckoutSessionResponse> createCheckoutSession(
            @RequestBody CreateOrderRequest request,
            @AuthenticationPrincipal UserPrinciples userPrinciple
    ) {
        try {
            // Use authenticated user's email (cannot be spoofed by client)
            String customerEmail = userPrinciple.getUsername(); // JWT sub claim = email

            // Create pending order linked to authenticated user
            Order order = orderService.createOrder(request, userPrinciple.getUserId(), customerEmail);

            // 2. Create Stripe checkout session
            CheckoutSessionResponse response = stripeService.createCheckoutSession(
                    request.getItems(),
                    order.getId(),
                    request.getCustomerEmail()
            );

            // 3. Persist session ID on order and payment
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
            Session session = stripeService.retrieveSession(sessionId);

            CheckoutSessionResponse response = new CheckoutSessionResponse();
            response.setSessionId(session.getId());
            response.setCheckoutUrl(session.getUrl());

            return ResponseEntity.ok(response);
        } catch (StripeException e) {
            logger.error("Session not found or Stripe error for sessionId={}: {}", sessionId, e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }
}
