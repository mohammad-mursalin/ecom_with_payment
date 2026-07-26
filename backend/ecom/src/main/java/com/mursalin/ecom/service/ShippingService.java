package com.mursalin.ecom.service;

import java.math.BigDecimal;

public interface ShippingService {
    BigDecimal calculateShippingCost(BigDecimal subtotal, String shippingMethod, String country);

    BigDecimal calculateTotal(BigDecimal subtotal, String shippingMethod, String country);
}
