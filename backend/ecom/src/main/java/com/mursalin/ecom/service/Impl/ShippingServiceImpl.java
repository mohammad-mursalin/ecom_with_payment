package com.mursalin.ecom.service.Impl;

import org.springframework.stereotype.Service;

import com.mursalin.ecom.service.ShippingService;

import lombok.RequiredArgsConstructor;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
@RequiredArgsConstructor
public class ShippingServiceImpl implements ShippingService{

    private static final BigDecimal FREE_SHIPPING_THRESHOLD = new BigDecimal("200.00");
    private static final BigDecimal BD_STANDARD = new BigDecimal("3.00");
    private static final BigDecimal BD_EXPRESS = new BigDecimal("6.00");
    private static final BigDecimal INTL_STANDARD = new BigDecimal("10.00");
    private static final BigDecimal INTL_EXPRESS = new BigDecimal("20.00");
    private static final String COUNTRY_BD = "BD";

    /**
     * Returns the shipping cost based on subtotal, shipping method, and country.
     *
     * @param subtotal      cart subtotal (before shipping)
     * @param shippingMethod "STANDARD" or "EXPRESS"
     * @param country        ISO 2-letter country code (e.g. "BD")
     * @return shipping cost
     */
    @Override
    public BigDecimal calculateShippingCost(BigDecimal subtotal, String shippingMethod, String country) {
        if (subtotal == null || subtotal.compareTo(FREE_SHIPPING_THRESHOLD) >= 0) {
            return BigDecimal.ZERO;
        }

        boolean isBangladesh = COUNTRY_BD.equalsIgnoreCase(country == null ? "" : country.trim());

        return switch (shippingMethod == null ? "STANDARD" : shippingMethod.toUpperCase()) {
            case "EXPRESS" -> isBangladesh ? BD_EXPRESS : INTL_EXPRESS;
            default -> isBangladesh ? BD_STANDARD : INTL_STANDARD;
        };
    }

    /**
     * Returns subtotal + shipping cost.
     */
         @Override
    public BigDecimal calculateTotal(BigDecimal subtotal, String shippingMethod, String country) {
        BigDecimal shipping = calculateShippingCost(subtotal, shippingMethod, country);
        return subtotal.add(shipping).setScale(2, RoundingMode.HALF_UP);
    }
}
