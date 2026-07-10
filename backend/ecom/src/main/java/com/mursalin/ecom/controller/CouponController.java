package com.mursalin.ecom.controller;

import com.mursalin.ecom.dto.ApiResponse;
import com.mursalin.ecom.dto.CouponValidationResult;
import com.mursalin.ecom.dto.CouponValidationResponse;
import com.mursalin.ecom.dto.ValidateCouponRequest;
import com.mursalin.ecom.model.UserPrinciples;
import com.mursalin.ecom.service.CartService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/coupons")
public class CouponController {

    @Autowired
    private CartService cartService;

    @PostMapping("/validate")
    public ResponseEntity<ApiResponse<CouponValidationResponse>> validateCoupon(
            @AuthenticationPrincipal UserPrinciples userPrinciple,
            @RequestBody ValidateCouponRequest request
    ) {
        CouponValidationResult result = cartService.validateCoupon(
                request.getCode(),
                request.getOrderSubtotal()
        );

        CouponValidationResponse body = new CouponValidationResponse(
                result.isValid(),
                result.getDiscountType(),
                result.getDiscountValue(),
                result.getDiscountAmount(),
                result.getMessage()
        );

        if (result.isValid()) {
            return ResponseEntity.ok(ApiResponse.ok(body));
        }
        return ResponseEntity.ok(ApiResponse.ok(body, result.getMessage()));
    }
}
