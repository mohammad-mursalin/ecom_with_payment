package com.mursalin.ecom.controller;

import com.mursalin.ecom.service.OrderService;
import com.stripe.model.Event;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payment")
@CrossOrigin
public class StripeWebhookController {

    @Autowired
    private OrderService orderService;

    @Value("${stripe.webhook.secret}")
    private String webhookSecret;

    @PostMapping("/webhook")
    public ResponseEntity<String> handleWebhook(@RequestBody String payload, @RequestHeader("Stripe-Signature") String sigHeader) {
        Event event;

        try {
            event = Webhook.constructEvent(payload, sigHeader, webhookSecret);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Webhook signature verification failed");
        }

        switch (event.getType()) {
            case "checkout.session.completed":
                handleCheckoutSessionCompleted(event);
                break;
            case "checkout.session.expired":
                handleCheckoutSessionExpired(event);
                break;
            case "payment_intent.payment_failed":
                handlePaymentFailed(event);
                break;
            default:
                System.out.println("Unhandled event type: " + event.getType());
        }

        return ResponseEntity.ok("Webhook processed");
    }

    private void handleCheckoutSessionCompleted(Event event) {
        try {
            Session session = (Session) event.getDataObjectDeserializer().getObject().orElse(null);
            if (session != null) {
                String sessionId = session.getId();
                String paymentIntentId = session.getPaymentIntent();
                
                System.out.println("Payment successful for session: " + sessionId);
                orderService.processSuccessfulPayment(sessionId, paymentIntentId);
            }
        } catch (Exception e) {
            System.err.println("Error processing checkout.session.completed: " + e.getMessage());
        }
    }

    private void handleCheckoutSessionExpired(Event event) {
        try {
            Session session = (Session) event.getDataObjectDeserializer().getObject().orElse(null);
            if (session != null) {
                String sessionId = session.getId();
                System.out.println("Payment expired for session: " + sessionId);
                orderService.processFailedPayment(sessionId);
            }
        } catch (Exception e) {
            System.err.println("Error processing checkout.session.expired: " + e.getMessage());
        }
    }

    private void handlePaymentFailed(Event event) {
        try {
            // Handle payment intent failure
            System.out.println("Payment failed event received");
        } catch (Exception e) {
            System.err.println("Error processing payment_intent.payment_failed: " + e.getMessage());
        }
    }
}