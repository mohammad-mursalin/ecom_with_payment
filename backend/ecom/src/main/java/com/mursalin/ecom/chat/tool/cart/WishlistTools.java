package com.mursalin.ecom.chat.tool.cart;

import com.mursalin.ecom.chat.tool.ToolErrorCode;
import com.mursalin.ecom.chat.tool.ToolResult;
import com.mursalin.ecom.chat.tool.ChatAuthResolver;
import com.mursalin.ecom.dto.ProductResponse;
import com.mursalin.ecom.dto.WishlistResponse;
import com.mursalin.ecom.model.Wishlist;
import com.mursalin.ecom.repository.ProductRepo;
import com.mursalin.ecom.repository.WishlistRepository;
import com.mursalin.ecom.service.WishlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class WishlistTools {

    private final WishlistService wishlistService;
    private final WishlistRepository wishlistRepository;
    private final ProductRepo productRepository;

    public ToolResult<WishlistToolResponse> getWishlist() {
        Long userId = ChatAuthResolver.resolveUserId();
        if (userId == null) {
            return ToolResult.failure(ToolErrorCode.AUTH_REQUIRED);
        }
        try {
            WishlistResponse wishlist = wishlistService.getWishlist(userId, "date_added");
            return ToolResult.success(toToolResponse(wishlist));
        } catch (Exception e) {
            return ToolResult.failure(ToolErrorCode.UNAVAILABLE);
        }
    }

    public ToolResult<ToggleWishlistResponse> toggleWishlist(Long productId) {
        Long userId = ChatAuthResolver.resolveUserId();
        if (userId == null) {
            return ToolResult.failure(ToolErrorCode.AUTH_REQUIRED);
        }
        if (productId == null || productId <= 0) {
            return ToolResult.failure(ToolErrorCode.VALIDATION_ERROR);
        }

        try {
            Optional<Wishlist> existing = wishlistRepository.findByUserIdAndProductId(userId, productId);
            boolean inWishlist;
            if (existing.isPresent()) {
                wishlistService.removeFromWishlist(userId, productId);
                inWishlist = false;
            } else {
                wishlistService.addToWishlist(userId, productId);
                inWishlist = true;
            }

            WishlistResponse wishlist = wishlistService.getWishlist(userId, "date_added");
            return ToolResult.success(new ToggleWishlistResponse(productId, inWishlist, wishlist.getTotalCount()));
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains("Product not found")) {
                return ToolResult.failure(ToolErrorCode.NOT_FOUND);
            }
            return ToolResult.failure(ToolErrorCode.UNAVAILABLE);
        }
    }

    private WishlistToolResponse toToolResponse(WishlistResponse wishlist) {
        List<WishlistItemDTO> items = wishlist.getItems().stream()
                .map(item -> {
                    ProductResponse p = item.getProduct();
                    return new WishlistItemDTO(
                            item.getProductId(),
                            p.getName(),
                            p.getPrice(),
                            p.getPrimaryImageUrl(),
                            item.getAddedAt()
                    );
                })
                .toList();
        return new WishlistToolResponse(items, wishlist.getTotalCount());
    }

    public record WishlistToolResponse(List<WishlistItemDTO> items, int totalCount) {}

    public record WishlistItemDTO(Long productId, String name, BigDecimal price, String primaryImageUrl, LocalDateTime addedAt) {}

    public record ToggleWishlistResponse(Long productId, boolean inWishlist, int totalCount) {}
}
