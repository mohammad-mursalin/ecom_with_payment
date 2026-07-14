package com.mursalin.ecom.chat.tool.cart;

import com.mursalin.ecom.chat.tool.ToolErrorCode;
import com.mursalin.ecom.chat.tool.ToolResult;
import com.mursalin.ecom.chat.tool.ChatAuthResolver;
import com.mursalin.ecom.dto.*;
import com.mursalin.ecom.model.Product;
import com.mursalin.ecom.repository.CartItemRepository;
import com.mursalin.ecom.repository.ProductRepo;
import com.mursalin.ecom.service.CartService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CartTools {

    private static final int MAX_CART_ITEMS = 50;

    private final CartService cartService;
    private final CartItemRepository cartItemRepository;
    private final ProductRepo productRepository;

    public ToolResult<CartToolResponse> getCart() {
        Long userId = ChatAuthResolver.resolveUserId();
        if (userId == null) {
            return ToolResult.failure(ToolErrorCode.AUTH_REQUIRED);
        }
        try {
            CartResponse cart = cartService.getCartSummary(userId);
            return ToolResult.success(toToolResponse(cart));
        } catch (Exception e) {
            return ToolResult.failure(ToolErrorCode.UNAVAILABLE);
        }
    }

    public ToolResult<CartToolResponse> addToCart(Long productId, Integer quantity) {
        Long userId = ChatAuthResolver.resolveUserId();
        if (userId == null) {
            return ToolResult.failure(ToolErrorCode.AUTH_REQUIRED);
        }
        if (productId == null || productId <= 0) {
            return ToolResult.failure(ToolErrorCode.VALIDATION_ERROR);
        }
        if (quantity == null || quantity < 1) {
            return ToolResult.failure(ToolErrorCode.VALIDATION_ERROR);
        }

        Product product = productRepository.findById(productId).orElse(null);
        if (product == null) {
            return ToolResult.failure(ToolErrorCode.NOT_FOUND);
        }

        int stockQty = product.getStockQuantity() != null ? product.getStockQuantity().intValue() : 0;
        if (quantity > stockQty) {
            return ToolResult.failure(ToolErrorCode.VALIDATION_ERROR, "Only " + stockQty + " left in stock");
        }

        List<com.mursalin.ecom.model.CartItem> existingItems = cartItemRepository.findByUserId(userId);
        if (existingItems.size() >= MAX_CART_ITEMS) {
            return ToolResult.failure(ToolErrorCode.VALIDATION_ERROR, "Cart is full (max 50 items)");
        }

        try {
            AddCartItemRequest request = new AddCartItemRequest();
            request.setProductId(productId);
            request.setQuantity(quantity);
            cartService.addItem(userId, request);
            CartResponse cart = cartService.getCartSummary(userId);
            return ToolResult.success(toToolResponse(cart));
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains("stock")) {
                Product p = productRepository.findById(productId).orElse(null);
                int available = p != null && p.getStockQuantity() != null ? p.getStockQuantity().intValue() : 0;
                return ToolResult.failure(ToolErrorCode.VALIDATION_ERROR, "Only " + available + " left in stock");
            }
            if (e.getMessage() != null && (e.getMessage().contains("full") || e.getMessage().contains("50"))) {
                return ToolResult.failure(ToolErrorCode.VALIDATION_ERROR, "Cart is full (max 50 items)");
            }
            return ToolResult.failure(ToolErrorCode.UNAVAILABLE);
        }
    }

    public ToolResult<CartToolResponse> updateCartItem(Long productId, Integer quantity) {
        Long userId = ChatAuthResolver.resolveUserId();
        if (userId == null) {
            return ToolResult.failure(ToolErrorCode.AUTH_REQUIRED);
        }
        if (productId == null || productId <= 0) {
            return ToolResult.failure(ToolErrorCode.VALIDATION_ERROR);
        }
        if (quantity == null || quantity < 0) {
            return ToolResult.failure(ToolErrorCode.VALIDATION_ERROR);
        }

        Optional<com.mursalin.ecom.model.CartItem> cartItemOpt = cartItemRepository.findByUserIdAndProductId(userId, productId);
        if (cartItemOpt.isEmpty()) {
            return ToolResult.failure(ToolErrorCode.NOT_FOUND);
        }

        com.mursalin.ecom.model.CartItem cartItem = cartItemOpt.get();

        if (quantity > 0) {
            Product product = cartItem.getProduct();
            int stockQty = product.getStockQuantity() != null ? product.getStockQuantity().intValue() : 0;
            if (quantity > stockQty) {
                return ToolResult.failure(ToolErrorCode.VALIDATION_ERROR, "Only " + stockQty + " left in stock");
            }
        }

        try {
            UpdateCartItemRequest request = new UpdateCartItemRequest();
            request.setQuantity(quantity);
            cartService.updateItem(userId, cartItem.getId(), request);
            CartResponse cart = cartService.getCartSummary(userId);
            return ToolResult.success(toToolResponse(cart));
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains("stock")) {
                Product product = cartItem.getProduct();
                int available = product != null && product.getStockQuantity() != null ? product.getStockQuantity().intValue() : 0;
                return ToolResult.failure(ToolErrorCode.VALIDATION_ERROR, "Only " + available + " left in stock");
            }
            return ToolResult.failure(ToolErrorCode.UNAVAILABLE);
        }
    }

    private CartToolResponse toToolResponse(CartResponse cart) {
        List<CartItemDTO> items = cart.getItems().stream()
                .map(item -> {
                    ProductResponse p = item.getProduct();
                    return new CartItemDTO(
                            p.getId(),
                            p.getName(),
                            p.getPrice(),
                            item.getQuantity(),
                            item.getLineTotal(),
                            p.getPrimaryImageUrl()
                    );
                })
                .toList();
        return new CartToolResponse(items, cart.getSubtotal(), cart.getItemCount());
    }

    public record CartToolResponse(List<CartItemDTO> items, BigDecimal subtotal, int itemCount) {}

    public record CartItemDTO(Long productId, String name, BigDecimal price, int quantity, BigDecimal lineTotal, String primaryImageUrl) {}
}
