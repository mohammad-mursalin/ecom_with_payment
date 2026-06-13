package com.mursalin.ecom.service;

import com.mursalin.ecom.dto.ProductResponse;
import com.mursalin.ecom.dto.WishlistItemResponse;
import com.mursalin.ecom.dto.WishlistResponse;
import com.mursalin.ecom.model.Product;
import com.mursalin.ecom.model.User;
import com.mursalin.ecom.model.Wishlist;
import com.mursalin.ecom.repository.ProductRepo;
import com.mursalin.ecom.repository.UserRepository;
import com.mursalin.ecom.repository.WishlistRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
public class WishlistService {

    @Autowired
    private WishlistRepository wishlistRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepo productRepository;

    @Autowired
    private ProductService productService;

    public WishlistResponse getWishlist(Long userId, String sort) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Wishlist> wishlists = wishlistRepository.findByUserId(userId);
        List<WishlistItemResponse> items = new ArrayList<>();

        for (Wishlist w : wishlists) {
            Product product = w.getProduct();
            if (product == null) continue;

            ProductResponse productResponse = productService.toProductResponse(product, true);
            items.add(new WishlistItemResponse(
                    w.getId(),
                    product.getId(),
                    productResponse,
                    w.getAddedAt()
            ));
        }

        items = sortItems(items, sort);

        return new WishlistResponse(items, items.size());
    }

    public WishlistItemResponse addToWishlist(Long userId, Long productId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        Optional<Wishlist> existing = wishlistRepository.findByUserIdAndProductId(userId, productId);
        if (existing.isPresent()) {
            Wishlist w = existing.get();
            ProductResponse productResponse = productService.toProductResponse(product, true);
            return new WishlistItemResponse(
                    w.getId(),
                    product.getId(),
                    productResponse,
                    w.getAddedAt()
            );
        }

        Wishlist wishlist = new Wishlist();
        wishlist.setUser(user);
        wishlist.setProduct(product);
        wishlist.setAddedAt(LocalDateTime.now());
        wishlist = wishlistRepository.save(wishlist);

        ProductResponse productResponse = productService.toProductResponse(product, true);
        return new WishlistItemResponse(
                wishlist.getId(),
                product.getId(),
                productResponse,
                wishlist.getAddedAt()
        );
    }

    public void removeFromWishlist(Long userId, Long productId) {
        Optional<Wishlist> existing = wishlistRepository.findByUserIdAndProductId(userId, productId);
        if (existing.isPresent()) {
            wishlistRepository.delete(existing.get());
        }
    }

    private List<WishlistItemResponse> sortItems(List<WishlistItemResponse> items, String sort) {
        if (sort == null || sort.isBlank() || "date_added".equals(sort)) {
            items.sort(Comparator.comparing(WishlistItemResponse::getAddedAt).reversed());
        } else if ("price_asc".equals(sort)) {
            items.sort(Comparator.comparing(item -> item.getProduct().getPrice()));
        } else if ("price_desc".equals(sort)) {
            items.sort(Comparator.comparing((WishlistItemResponse item) -> item.getProduct().getPrice()).reversed());
        } else if ("name_asc".equals(sort)) {
            items.sort(Comparator.comparing(item -> item.getProduct().getName()));
        }
        return items;
    }
}
