package com.mursalin.ecom.controller;

import com.mursalin.ecom.dto.ApiResponse;
import com.mursalin.ecom.service.ShippingService;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/shipping")
@Validated
public class ShippingController {

    private final ShippingService shippingService;

    public ShippingController(ShippingService shippingService) {
        this.shippingService = shippingService;
    }

    /**
     * GET /api/shipping/estimate?subtotal=99.99&method=STANDARD
     * Returns the shipping cost for the given subtotal and method.
     * Country is currently hardcoded to BD.
     */
    @GetMapping("/estimate")
    public ResponseEntity<ApiResponse<BigDecimal>> estimateShipping(
            @RequestParam @NotBlank @DecimalMin("0.0") String subtotal,
            @RequestParam(required = false) @NotBlank String method
    ) {
        BigDecimal subtotalBD = new BigDecimal(subtotal);
        BigDecimal cost = shippingService.calculateShippingCost(
                subtotalBD,
                method != null ? method : "STANDARD",
                "BD"
        );
        return ResponseEntity.ok(ApiResponse.success(cost));
    }
}
