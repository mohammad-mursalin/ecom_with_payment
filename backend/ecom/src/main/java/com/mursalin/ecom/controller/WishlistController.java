package com.mursalin.ecom.controller;

import com.mursalin.ecom.dto.ApiResponse;
import com.mursalin.ecom.dto.WishlistItemResponse;
import com.mursalin.ecom.dto.WishlistResponse;
import com.mursalin.ecom.model.UserPrinciples;
import com.mursalin.ecom.service.WishlistService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/wishlist")
@CrossOrigin
public class WishlistController {

    @Autowired
    private WishlistService wishlistService;

    @GetMapping
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<WishlistResponse> getWishlist(
            @AuthenticationPrincipal UserPrinciples userPrinciple,
            @RequestParam(defaultValue = "date_added") String sort
    ) {
        WishlistResponse response = wishlistService.getWishlist(userPrinciple.getUserId(), sort);
        return ResponseEntity.ok(response);
    }

    @PostMapping
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<WishlistItemResponse> addToWishlist(
            @AuthenticationPrincipal UserPrinciples userPrinciple,
            @RequestBody Map<String, Long> body
    ) {
        Long productId = body.get("productId");
        if (productId == null) {
            return ResponseEntity.badRequest().build();
        }
        WishlistItemResponse response = wishlistService.addToWishlist(userPrinciple.getUserId(), productId);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{productId}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<String>> removeFromWishlist(
            @AuthenticationPrincipal UserPrinciples userPrinciple,
            @PathVariable Long productId
    ) {
        wishlistService.removeFromWishlist(userPrinciple.getUserId(), productId);
        return ResponseEntity.ok(ApiResponse.success("Product removed from wishlist"));
    }
}
