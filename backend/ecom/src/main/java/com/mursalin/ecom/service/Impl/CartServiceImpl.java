package com.mursalin.ecom.service.Impl;

import com.mursalin.ecom.dto.*;
import com.mursalin.ecom.model.*;
import com.mursalin.ecom.repository.CartItemRepository;
import com.mursalin.ecom.repository.CouponRepository;
import com.mursalin.ecom.repository.UserRepository;
import com.mursalin.ecom.service.CartService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CartServiceImpl implements CartService {

    private static final Logger logger = LoggerFactory.getLogger(CartService.class);
    private static final int MAX_CART_ITEMS = 50;

    private final CartItemRepository cartItemRepository;

    private final com.mursalin.ecom.repository.ProductRepo productRepository;

    private final UserRepository userRepository;

    private final CouponRepository couponRepository;

    @Override
    public List<CartItem> getCartItems(Long userId) {
        return cartItemRepository.findByUserId(userId);
    }

    @Override
    public CartItem addItem(Long userId, AddCartItemRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new RuntimeException("Product not found"));

        int stockQty = product.getStockQuantity() != null ? product.getStockQuantity().intValue() : 0;

        if (request.getQuantity() < 1) {
            throw new RuntimeException("Quantity must be at least 1");
        }
        if (request.getQuantity() > stockQty) {
            throw new RuntimeException("Requested quantity exceeds available stock");
        }

        List<CartItem> existingItems = cartItemRepository.findByUserId(userId);
        if (existingItems.size() >= MAX_CART_ITEMS) {
            throw new RuntimeException("Cart is full. Maximum " + MAX_CART_ITEMS + " items allowed.");
        }

        Optional<CartItem> existingOpt = cartItemRepository.findByUserIdAndProductId(userId, request.getProductId());
        if (existingOpt.isPresent()) {
            CartItem existing = existingOpt.get();
            int newQty = existing.getQuantity() + request.getQuantity();
            if (newQty > stockQty) {
                newQty = stockQty;
            }
            existing.setQuantity(newQty);
            return cartItemRepository.save(existing);
        } else {
            CartItem item = new CartItem();
            item.setUser(user);
            item.setProduct(product);
            item.setQuantity(request.getQuantity());
            return cartItemRepository.save(item);
        }
    }

    @Override
    @Transactional
    public CartItem updateItem(Long userId, Long itemId, UpdateCartItemRequest request) {
        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Cart item not found"));

        if (!item.getUser().getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        if (request.getQuantity() == 0) {
            cartItemRepository.delete(item);
            return null;
        }

        if (request.getQuantity() < 1) {
            throw new RuntimeException("Quantity must be at least 1");
        }
        int stockQty = item.getProduct().getStockQuantity() != null ? item.getProduct().getStockQuantity().intValue() : 0;
        if (request.getQuantity() > stockQty) {
            throw new RuntimeException("Requested quantity exceeds available stock");
        }

        item.setQuantity(request.getQuantity());
        return cartItemRepository.save(item);
    }

    @Override
    @Transactional
    public void removeItem(Long userId, Long itemId) {
        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Cart item not found"));

        if (!item.getUser().getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        cartItemRepository.delete(item);
    }

    @Override
    @Transactional
    public List<CartItem> syncCart(Long userId, List<SyncCartItem> guestItems) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<CartItem> serverItems = cartItemRepository.findByUserId(userId);
        Map<Long, CartItem> serverMap = new HashMap<>();
        for (CartItem item : serverItems) {
            serverMap.put(item.getProduct().getId(), item);
        }

        int totalItems = serverItems.size();

        for (SyncCartItem guestItem : guestItems) {
            if (guestItem.getProductId() == null || guestItem.getQuantity() == null || guestItem.getQuantity() < 1) {
                continue;
            }

            Product product = productRepository.findById(guestItem.getProductId())
                    .orElse(null);
            if (product == null) continue;

            int guestQty = Math.min(guestItem.getQuantity(), product.getStockQuantity() != null ? product.getStockQuantity().intValue() : 0);

            if (serverMap.containsKey(guestItem.getProductId())) {
                CartItem existing = serverMap.get(guestItem.getProductId());
                int newQty = Math.max(existing.getQuantity(), guestQty);
                newQty = Math.min(newQty, product.getStockQuantity() != null ? product.getStockQuantity().intValue() : 0);
                existing.setQuantity(newQty);
                cartItemRepository.save(existing);
            } else {
                if (totalItems >= MAX_CART_ITEMS) {
                    break;
                }
                CartItem newItem = new CartItem();
                newItem.setUser(user);
                newItem.setProduct(product);
                newItem.setQuantity(Math.min(guestQty, product.getStockQuantity() != null ? product.getStockQuantity().intValue() : 0));
                cartItemRepository.save(newItem);
                totalItems++;
            }
        }

        return cartItemRepository.findByUserId(userId);
    }

    @Override
    public CartResponse getCartSummary(Long userId) {
        List<CartItem> items = cartItemRepository.findByUserId(userId);
        BigDecimal subtotal = BigDecimal.ZERO;
        int itemCount = 0;

        for (CartItem item : items) {
            BigDecimal lineTotal = item.getProduct().getPrice()
                    .multiply(BigDecimal.valueOf(item.getQuantity()));
            subtotal = subtotal.add(lineTotal);
            itemCount += item.getQuantity();
        }

        List<CartItemResponse> itemResponses = new ArrayList<>();
        for (CartItem item : items) {
            Product p = item.getProduct();
            BigDecimal lineTotal = p.getPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
              ProductResponse productResponse = new ProductResponse(
                      p.getId(), p.getName(), p.getDescription(),
                      p.getBrandEntity() != null ? new ProductResponse.BrandInfo(p.getBrandEntity().getId(), p.getBrandEntity().getName()) : null,
                      p.getCategoryEntity() != null ? new ProductResponse.CategoryInfo(p.getCategoryEntity().getId(), p.getCategoryEntity().getName(), p.getCategoryEntity().getSlug()) : null,
                      p.getPrice(), p.getOriginalPrice(), p.getStockQuantity(), p.isActive(), p.isFeatured(),
                      p.getImageUrl(), 0.0, 0L, new ArrayList<>(), new ArrayList<>(), new ArrayList<>(), new ArrayList<>(), false
              );
            itemResponses.add(new CartItemResponse(item.getId(), productResponse, item.getQuantity(), lineTotal));
        }

        CartResponse response = new CartResponse();
        response.setItems(itemResponses);
        response.setSubtotal(subtotal);
        response.setItemCount(itemCount);
        return response;
    }

    @Override
    public CouponValidationResult validateCoupon(String code, BigDecimal orderSubtotal) {
        Coupon coupon = couponRepository.findByCodeAndIsActiveTrue(code)
                .orElse(null);

        if (coupon == null) {
            return new CouponValidationResult(false, "Invalid or expired coupon code", null, null, null, BigDecimal.ZERO);
        }

        if (coupon.getExpiresAt() != null && coupon.getExpiresAt().isBefore(LocalDateTime.now())) {
            return new CouponValidationResult(false, "Invalid or expired coupon code", null, null, null, BigDecimal.ZERO);
        }

        if (coupon.getMaxUses() != null && coupon.getUsesCount() >= coupon.getMaxUses()) {
            return new CouponValidationResult(false, "Invalid or expired coupon code", null, null, null, BigDecimal.ZERO);
        }

        if (coupon.getMinOrderValue() != null && orderSubtotal.compareTo(coupon.getMinOrderValue()) < 0) {
            return new CouponValidationResult(false, "Minimum order value of ₹" + coupon.getMinOrderValue() + " required", null, null, null, BigDecimal.ZERO);
        }

        BigDecimal discountAmount;
        if (coupon.getDiscountType() == DiscountType.PERCENT) {
            discountAmount = orderSubtotal.multiply(coupon.getDiscountValue())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        } else {
            discountAmount = coupon.getDiscountValue();
            if (discountAmount.compareTo(orderSubtotal) > 0) {
                discountAmount = orderSubtotal;
            }
        }

        return new CouponValidationResult(true, "Coupon applied successfully",
                coupon.getDiscountType().name(),
                coupon.getDiscountValue(),
                coupon.getCode(),
                discountAmount);
    }
}
