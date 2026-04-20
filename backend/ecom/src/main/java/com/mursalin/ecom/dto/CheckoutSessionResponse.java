package com.mursalin.ecom.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

public class CheckoutSessionResponse {
    private String sessionId;
    private String checkoutUrl;

    public CheckoutSessionResponse(String sessionId, String checkoutUrl, Long orderId) {
        this.sessionId = sessionId;
        this.checkoutUrl = checkoutUrl;
        this.orderId = orderId;
    }

    public CheckoutSessionResponse() {

    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public String getCheckoutUrl() {
        return checkoutUrl;
    }

    public void setCheckoutUrl(String checkoutUrl) {
        this.checkoutUrl = checkoutUrl;
    }

    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }

    private Long orderId;

}