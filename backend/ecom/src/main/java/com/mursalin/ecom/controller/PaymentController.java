package com.mursalin.ecom.controller;

import com.mursalin.ecom.dto.CheckoutSessionResponse;
import com.mursalin.ecom.dto.CreateOrderRequest;
import com.mursalin.ecom.model.Order;
import com.mursalin.ecom.service.OrderService;
import com.mursalin.ecom.service.StripeService;
import com.stripe.exception.StripeException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payment")
@CrossOrigin
public class PaymentController {

    @Autowired
    private OrderService orderService;

    @Autowired
    private StripeService stripeService;

    @PostMapping("/create-checkout-session")
    public ResponseEntity<CheckoutSessionResponse> createCheckoutSession(@RequestBody CreateOrderRequest request) {
        try {
            // Create pending order
            Order order = orderService.createOrder(request);

            // Create Stripe checkout session
            CheckoutSessionResponse response = stripeService.createCheckoutSession(
                    request.getItems(),
                    order.getId(),
                    request.getCustomerEmail()
            );

            // Update order with session ID
            orderService.updateOrderSessionId(order.getId(), response.getSessionId());

            return ResponseEntity.ok(response);
        } catch (StripeException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/session/{sessionId}")
    public ResponseEntity<CheckoutSessionResponse> getSessionStatus(@PathVariable String sessionId) {
        try {
            var session = stripeService.retrieveSession(sessionId);
            
            CheckoutSessionResponse response = new CheckoutSessionResponse();
            response.setSessionId(session.getId());
            response.setCheckoutUrl(session.getUrl());
            
            String paymentStatus = session.getPaymentStatus();
            // You could get order ID from metadata if needed
            
            return ResponseEntity.ok(response);
        } catch (StripeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}