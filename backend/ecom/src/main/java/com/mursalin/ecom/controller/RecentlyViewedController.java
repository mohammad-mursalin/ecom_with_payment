package com.mursalin.ecom.controller;

import com.mursalin.ecom.dto.ApiResponse;
import com.mursalin.ecom.dto.ProductResponse;
import com.mursalin.ecom.model.UserPrinciples;
import com.mursalin.ecom.service.RecentlyViewedService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users/me/recently-viewed")
public class RecentlyViewedController {

    @Autowired
    private RecentlyViewedService recentlyViewedService;

    @GetMapping
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<List<ProductResponse>> getRecentlyViewed(
            @AuthenticationPrincipal UserPrinciples userPrinciple,
            @RequestParam(defaultValue = "20") Integer limit
    ) {
        List<ProductResponse> items = recentlyViewedService.getRecentlyViewed(userPrinciple.getUserId(), limit);
        return ResponseEntity.ok(items);
    }

    @PostMapping
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<String>> addRecentlyViewed(
            @AuthenticationPrincipal UserPrinciples userPrinciple,
            @RequestBody java.util.Map<String, Long> body
    ) {
        Long productId = body.get("productId");
        if (productId == null) {
            return ResponseEntity.badRequest().body(ApiResponse.success("Product ID required"));
        }
        recentlyViewedService.addRecentlyViewed(userPrinciple.getUserId(), productId);
        return ResponseEntity.ok(ApiResponse.success("Product added to recently viewed"));
    }

    @DeleteMapping
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<String>> clearRecentlyViewed(
            @AuthenticationPrincipal UserPrinciples userPrinciple
    ) {
        recentlyViewedService.clearRecentlyViewed(userPrinciple.getUserId());
        return ResponseEntity.ok(ApiResponse.success("Recently viewed cleared"));
    }
}
