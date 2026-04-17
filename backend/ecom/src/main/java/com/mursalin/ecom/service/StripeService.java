package com.mursalin.ecom.service;

import com.mursalin.ecom.dto.CheckoutSessionResponse;
import com.mursalin.ecom.dto.OrderItemDTO;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
public class StripeService {

    @Value("${stripe.secret.key}")
    private String stripeSecretKey;

    @Value("${stripe.success.url}")
    private String successUrl;

    @Value("${stripe.cancel.url}")
    private String cancelUrl;

    @PostConstruct
    public void init() {
        Stripe.apiKey = stripeSecretKey;
    }

    public CheckoutSessionResponse createCheckoutSession(List<OrderItemDTO> items, Long orderId, String customerEmail) throws StripeException {
        
        List<SessionCreateParams.LineItem> lineItems = new ArrayList<>();

        for (OrderItemDTO item : items) {
            long amountInCents = item.getUnitPrice().multiply(BigDecimal.valueOf(100)).longValue();
            
            SessionCreateParams.LineItem lineItem = SessionCreateParams.LineItem.builder()
                    .setPriceData(SessionCreateParams.LineItem.PriceData.builder()
                            .setCurrency("usd")
                            .setUnitAmount(amountInCents)
                            .setProductData(SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                    .setName(item.getProductName())
                                    .setDescription(item.getProductBrand())
                                    .build())
                            .build())
                    .setQuantity((long) item.getQuantity())
                    .build();
            
            lineItems.add(lineItem);
        }

        SessionCreateParams params = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setSuccessUrl(successUrl + "?session_id={CHECKOUT_SESSION_ID}")
                .setCancelUrl(cancelUrl + "?order_id=" + orderId)
                .addAllLineItem(lineItems)
                .setCustomerEmail(customerEmail)
                .putMetadata("order_id", orderId.toString())
                .build();

        Session session = Session.create(params);

        CheckoutSessionResponse response = new CheckoutSessionResponse();
        response.setSessionId(session.getId());
        response.setCheckoutUrl(session.getUrl());
        response.setOrderId(orderId);

        return response;
    }

    public Session retrieveSession(String sessionId) throws StripeException {
        return Session.retrieve(sessionId);
    }
}