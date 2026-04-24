package com.mursalin.ecom.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mursalin.ecom.service.OrderService;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.net.Webhook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * KEY DESIGN NOTES:
 *
 * 1. @RequestBody MUST be String (raw) for HMAC-SHA256 signature verification.
 *
 * 2. event.getData().toJson() returns the EventData wrapper, NOT the inner resource.
 *    Structure: { "previous_attributes": null, "object": { <resource fields> } }
 *    Must unwrap via root.path("object") — this was the cause of "missing session id".
 *
 * 3. Do NOT use event.getDataObjectDeserializer().getObject() — returns Optional.empty()
 *    when Stripe account API version is newer than the SDK bundled version.
 */
@RestController
@RequestMapping("/api/payment")
@CrossOrigin
public class StripeWebhookController {

    private static final Logger logger = LoggerFactory.getLogger(StripeWebhookController.class);

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    private OrderService orderService;

    @Value("${stripe.webhook.secret}")
    private String webhookSecret;

    @PostMapping("/webhook")
    public ResponseEntity<String> handleWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String sigHeader
    ) {
        Event event;
        try {
            event = Webhook.constructEvent(payload, sigHeader, webhookSecret);
        } catch (SignatureVerificationException e) {
            logger.warn("Webhook signature verification failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Webhook signature verification failed");
        } catch (Exception e) {
            logger.error("Unexpected error during webhook signature verification: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Webhook processing error");
        }

        logger.info("Received Stripe event: type={}, id={}", event.getType(), event.getId());

        switch (event.getType()) {
            case "checkout.session.completed":
                handleCheckoutSessionCompleted(event);
                break;
            case "checkout.session.expired":
                handleCheckoutSessionExpired(event);
                break;
            case "payment_intent.succeeded":
                handlePaymentIntentSucceeded(event);
                break;
            case "payment_intent.payment_failed":
                handlePaymentFailed(event);
                break;
            default:
                logger.debug("Unhandled event type: {}", event.getType());
        }

        return ResponseEntity.ok("Webhook processed");
    }

    /**
     * event.getData().toJson() always wraps the resource under an "object" key:
     *   { "previous_attributes": null, "object": { "id": "cs_test_...", ... } }
     * This helper unwraps it so callers can read fields like "id" directly.
     */
    private JsonNode extractDataObject(Event event) throws Exception {
        String rawData = event.getData().toJson();
        JsonNode root = objectMapper.readTree(rawData);
        return root.has("object") ? root.path("object") : root;
    }

    private void handleCheckoutSessionCompleted(Event event) {
        try {
            JsonNode session = extractDataObject(event);

            String sessionId = session.path("id").asText(null);
            String paymentIntentId = session.path("payment_intent").asText(null);

            if (paymentIntentId != null && paymentIntentId.isBlank()) {
                paymentIntentId = null;
            }

            if (sessionId == null || sessionId.isBlank()) {
                logger.error("checkout.session.completed: could not extract session id. node={}", session);
                return;
            }

            logger.info("=== Handle checkout.session.completed === sessionId={}, paymentIntentId={}",
                    sessionId, paymentIntentId);
            orderService.processSuccessfulPayment(sessionId, paymentIntentId);

        } catch (Exception e) {
            logger.error("Error processing checkout.session.completed: {}", e.getMessage(), e);
        }
    }

    private void handleCheckoutSessionExpired(Event event) {
        try {
            JsonNode session = extractDataObject(event);

            String sessionId = session.path("id").asText(null);

            if (sessionId == null || sessionId.isBlank()) {
                logger.error("checkout.session.expired: could not extract session id. node={}", session);
                return;
            }

            logger.info("=== Handle checkout.session.expired === sessionId={}", sessionId);
            orderService.processFailedPayment(sessionId);

        } catch (Exception e) {
            logger.error("Error processing checkout.session.expired: {}", e.getMessage(), e);
        }
    }

    private void handlePaymentIntentSucceeded(Event event) {
        try {
            JsonNode intent = extractDataObject(event);

            String paymentIntentId = intent.path("id").asText(null);

            if (paymentIntentId == null || paymentIntentId.isBlank()) {
                logger.error("payment_intent.succeeded: could not extract intent id. node={}", intent);
                return;
            }

            logger.info("=== Handle payment_intent.succeeded === paymentIntentId={}", paymentIntentId);
            orderService.processSuccessfulPaymentByIntentId(paymentIntentId);

        } catch (RuntimeException e) {
            logger.warn("Could not process payment_intent.succeeded (likely already handled by " +
                    "checkout.session.completed): {}", e.getMessage());
        } catch (Exception e) {
            logger.error("Error processing payment_intent.succeeded: {}", e.getMessage(), e);
        }
    }

    private void handlePaymentFailed(Event event) {
        try {
            JsonNode intent = extractDataObject(event);
            String paymentIntentId = intent.path("id").asText("unknown");
            String errorMessage = intent.path("last_payment_error").path("message").asText("no details");
            logger.warn("=== Handle payment_intent.payment_failed === paymentIntentId={}, error={}",
                    paymentIntentId, errorMessage);
            // Order marked FAILED via checkout.session.expired event.
        } catch (Exception e) {
            logger.error("Error processing payment_intent.payment_failed: {}", e.getMessage(), e);
        }
    }
}