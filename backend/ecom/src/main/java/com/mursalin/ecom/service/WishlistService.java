package com.mursalin.ecom.service;

import com.mursalin.ecom.dto.WishlistItemResponse;
import com.mursalin.ecom.dto.WishlistResponse;

public interface WishlistService {
    WishlistResponse getWishlist(Long userId, String sort);

    WishlistItemResponse addToWishlist(Long userId, Long productId);

    void removeFromWishlist(Long userId, Long productId);
}
