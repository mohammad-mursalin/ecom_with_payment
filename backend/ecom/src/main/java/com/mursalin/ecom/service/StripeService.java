package com.mursalin.ecom.service;

import com.mursalin.ecom.dto.CheckoutSessionResponse;
import com.mursalin.ecom.dto.OrderItemDTO;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;

import java.math.BigDecimal;
import java.util.List;

public interface StripeService {
    CheckoutSessionResponse createCheckoutSession(
            List<OrderItemDTO> items,
            Long orderId,
            String customerEmail,
            BigDecimal shippingCost,
            String shippingMethod
    ) throws StripeException;

    PaymentIntent createPaymentIntent(BigDecimal amountInRupees, String metadataKey, String metadataValue)
            throws StripeException;

    PaymentIntent retrievePaymentIntent(String paymentIntentId) throws StripeException;

    CheckoutSessionResponse getSessionStatus(String sessionId) throws StripeException;

    String getPublishableKey();
}
