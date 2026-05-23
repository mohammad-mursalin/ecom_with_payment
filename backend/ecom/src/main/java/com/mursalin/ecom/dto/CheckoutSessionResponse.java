package com.mursalin.ecom.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
//@NoArgsConstructor
//@AllArgsConstructor
public class CheckoutSessionResponse {
    private String sessionId;
    private String checkoutUrl;
    private Long orderId;
    private BigDecimal shippingCost;
    private String shippingMethod;

    public CheckoutSessionResponse(String sessionId, String checkoutUrl, Long orderId, BigDecimal shippingCost, String shippingMethod) {
        this.sessionId = sessionId;
        this.checkoutUrl = checkoutUrl;
        this.orderId = orderId;
        this.shippingCost = shippingCost;
        this.shippingMethod = shippingMethod;
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

    public BigDecimal getShippingCost() {
        return shippingCost;
    }

    public void setShippingCost(BigDecimal shippingCost) {
        this.shippingCost = shippingCost;
    }

    public String getShippingMethod() {
        return shippingMethod;
    }

    public void setShippingMethod(String shippingMethod) {
        this.shippingMethod = shippingMethod;
    }
}
