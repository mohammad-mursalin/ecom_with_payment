package com.mursalin.ecom.service;

import com.mursalin.ecom.dto.AddCartItemRequest;
import com.mursalin.ecom.dto.CartResponse;
import com.mursalin.ecom.dto.CouponValidationResult;
import com.mursalin.ecom.dto.SyncCartItem;
import com.mursalin.ecom.dto.UpdateCartItemRequest;
import com.mursalin.ecom.model.CartItem;

import java.math.BigDecimal;
import java.util.List;

public interface CartService {
    List<CartItem> getCartItems(Long userId);

    CartItem addItem(Long userId, AddCartItemRequest request);

    CartItem updateItem(Long userId, Long itemId, UpdateCartItemRequest request);

    void removeItem(Long userId, Long itemId);

    List<CartItem> syncCart(Long userId, List<SyncCartItem> guestItems);

    CartResponse getCartSummary(Long userId);

    CouponValidationResult validateCoupon(String code, BigDecimal orderSubtotal);
}
