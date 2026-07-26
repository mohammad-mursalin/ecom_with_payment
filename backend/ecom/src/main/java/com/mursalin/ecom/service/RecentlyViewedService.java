package com.mursalin.ecom.service;

import com.mursalin.ecom.dto.ProductResponse;

import java.util.List;

public interface RecentlyViewedService {
    List<ProductResponse> getRecentlyViewed(Long userId, Integer limit);

    void addRecentlyViewed(Long userId, Long productId);

    void clearRecentlyViewed(Long userId);
}
