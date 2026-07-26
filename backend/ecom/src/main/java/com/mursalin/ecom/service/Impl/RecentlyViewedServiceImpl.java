package com.mursalin.ecom.service.Impl;

import com.mursalin.ecom.dto.ProductResponse;
import com.mursalin.ecom.model.Product;
import com.mursalin.ecom.model.RecentlyViewed;
import com.mursalin.ecom.model.User;
import com.mursalin.ecom.repository.ProductRepo;
import com.mursalin.ecom.repository.RecentlyViewedRepository;
import com.mursalin.ecom.repository.UserRepository;
import com.mursalin.ecom.service.ProductService;
import com.mursalin.ecom.service.RecentlyViewedService;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RecentlyViewedServiceImpl implements RecentlyViewedService {

    private static final int MAX_ENTRIES = 20;

    private final RecentlyViewedRepository recentlyViewedRepository;
    private final UserRepository userRepository;
    private final ProductRepo productRepository;
    private final ProductService productService;

    @Override
    public List<ProductResponse> getRecentlyViewed(Long userId, Integer limit) {
        int pageSize = limit != null ? Math.min(limit, MAX_ENTRIES) : MAX_ENTRIES;
        List<RecentlyViewed> entries = recentlyViewedRepository.findByUserIdOrderByViewedAtDesc(userId, org.springframework.data.domain.PageRequest.of(0, pageSize)).getContent();
        return entries.stream()
                .map(rv -> {
                    Product p = rv.getProduct();
                    if (p == null) return null;
                    ProductResponse resp = productService.toProductResponse(p, null);
                    return new ProductResponse(
                            resp.getId(),
                            resp.getName(),
                            resp.getDescription(),
                            resp.getBrand(),
                            resp.getCategory(),
                            resp.getPrice(),
                            resp.getOriginalPrice(),
                            resp.getStock(),
                            resp.getIsActive(),
                            resp.getIsFeatured(),
                            resp.getPrimaryImageUrl(),
                            resp.getAverageRating(),
                            resp.getReviewCount(),
                            resp.getImages(),
                            resp.getSpecs(),
                            resp.getTags(),
                            resp.getHighlights(),
                            resp.getIsWishlisted()
                    );
                })
                .collect(Collectors.toList());
    }

    @Override
    public void addRecentlyViewed(Long userId, Long productId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        java.util.Optional<RecentlyViewed> existing = recentlyViewedRepository.findByUserIdAndProductId(userId, productId);
        if (existing.isPresent()) {
            RecentlyViewed rv = existing.get();
            rv.setViewedAt(java.time.LocalDateTime.now());
            recentlyViewedRepository.save(rv);
        } else {
            RecentlyViewed rv = new RecentlyViewed();
            rv.setUser(user);
            rv.setProduct(product);
            rv.setViewedAt(java.time.LocalDateTime.now());
            recentlyViewedRepository.save(rv);
        }

        int count = recentlyViewedRepository.countByUser_UserId(userId);
        if (count > MAX_ENTRIES) {
            List<RecentlyViewed> oldest = recentlyViewedRepository.findOldestByUser(userId);
            int toDelete = count - MAX_ENTRIES;
            for (int i = 0; i < toDelete && i < oldest.size(); i++) {
                recentlyViewedRepository.delete(oldest.get(i));
            }
        }
    }

    @Override
    public void clearRecentlyViewed(Long userId) {
        List<RecentlyViewed> all = recentlyViewedRepository.findByUserIdOrderByViewedAtDesc(userId, org.springframework.data.domain.PageRequest.of(0, MAX_ENTRIES)).getContent();
        recentlyViewedRepository.deleteAll(all);
    }
}
