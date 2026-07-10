package com.mursalin.ecom.controller;

import com.mursalin.ecom.dto.AddCartItemRequest;
import com.mursalin.ecom.dto.CartResponse;
import com.mursalin.ecom.dto.SyncCartRequest;
import com.mursalin.ecom.dto.UpdateCartItemRequest;
import com.mursalin.ecom.model.UserPrinciples;
import com.mursalin.ecom.service.CartService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
public class CartController {

    private static final Logger logger = LoggerFactory.getLogger(CartController.class);

    @Autowired
    private CartService cartService;

    @GetMapping
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<CartResponse> getCart(@AuthenticationPrincipal UserPrinciples userPrinciple) {
        CartResponse response = cartService.getCartSummary(userPrinciple.getUserId());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/items")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<CartResponse> addItem(
            @AuthenticationPrincipal UserPrinciples userPrinciple,
            @RequestBody AddCartItemRequest request
    ) {
        cartService.addItem(userPrinciple.getUserId(), request);
        CartResponse response = cartService.getCartSummary(userPrinciple.getUserId());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/items/{id}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<CartResponse> updateItem(
            @AuthenticationPrincipal UserPrinciples userPrinciple,
            @PathVariable Long id,
            @RequestBody UpdateCartItemRequest request
    ) {
        cartService.updateItem(userPrinciple.getUserId(), id, request);
        CartResponse response = cartService.getCartSummary(userPrinciple.getUserId());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/items/{id}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<CartResponse> removeItem(
            @AuthenticationPrincipal UserPrinciples userPrinciple,
            @PathVariable Long id
    ) {
        cartService.removeItem(userPrinciple.getUserId(), id);
        CartResponse response = cartService.getCartSummary(userPrinciple.getUserId());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/sync")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<CartResponse> syncCart(
            @AuthenticationPrincipal UserPrinciples userPrinciple,
            @RequestBody SyncCartRequest request
    ) {
        cartService.syncCart(userPrinciple.getUserId(), request.getItems());
        CartResponse response = cartService.getCartSummary(userPrinciple.getUserId());
        return ResponseEntity.ok(response);
    }
}
