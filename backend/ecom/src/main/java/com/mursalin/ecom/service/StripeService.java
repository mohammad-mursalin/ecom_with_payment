package com.mursalin.ecom.service;

import com.mursalin.ecom.dto.CheckoutSessionResponse;
import com.mursalin.ecom.dto.OrderItemDTO;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
public class StripeService {

    private static final Logger logger = LoggerFactory.getLogger(StripeService.class);

    @Value("${stripe.secret.key}")
    private String stripeSecretKey;

    @Value("${stripe.success.url}")
    private String successUrl;

    @Value("${stripe.cancel.url}")
    private String cancelUrl;

    @PostConstruct
    public void init() {
        Stripe.apiKey = stripeSecretKey;
        logger.info("Stripe API key initialised");
    }

    public CheckoutSessionResponse createCheckoutSession(
            List<OrderItemDTO> items,
            Long orderId,
            String customerEmail
    ) throws StripeException {

        List<SessionCreateParams.LineItem> lineItems = new ArrayList<>();

        for (OrderItemDTO item : items) {
            long amountInCents = item.getUnitPrice()
                    .multiply(BigDecimal.valueOf(100))
                    .longValue();

            SessionCreateParams.LineItem lineItem = SessionCreateParams.LineItem.builder()
                    .setPriceData(SessionCreateParams.LineItem.PriceData.builder()
                            .setCurrency("usd")
                            .setUnitAmount(amountInCents)
                            .setProductData(SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                    .setName(item.getProductName())
                                    .setDescription(item.getProductBrand() != null ? item.getProductBrand() : "")
                                    .build())
                            .build())
                    .setQuantity((long) item.getQuantity())
                    .build();

            lineItems.add(lineItem);
        }

        SessionCreateParams.Builder paramsBuilder = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setSuccessUrl(successUrl + "?session_id={CHECKOUT_SESSION_ID}")
                .setCancelUrl(cancelUrl + "?order_id=" + orderId)
                .addAllLineItem(lineItems)
                .putMetadata("order_id", orderId.toString());

        if (customerEmail != null && !customerEmail.isBlank()) {
            paramsBuilder.setCustomerEmail(customerEmail);
        }

        Session session = Session.create(paramsBuilder.build());

        logger.info("Created Stripe checkout session id={} for orderId={}", session.getId(), orderId);

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
