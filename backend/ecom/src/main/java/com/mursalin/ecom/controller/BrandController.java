package com.mursalin.ecom.controller;

import com.mursalin.ecom.dto.ApiResponse;
import com.mursalin.ecom.dto.BrandRequest;
import com.mursalin.ecom.dto.BrandResponse;
import com.mursalin.ecom.dto.ErrorResponse;
import com.mursalin.ecom.service.BrandService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/brands")
public class BrandController {

    private final BrandService brandService;

    public BrandController(BrandService brandService) {
        this.brandService = brandService;
    }

    @GetMapping
    public ResponseEntity<List<BrandResponse>> getAllBrands() {
        List<BrandResponse> brands = brandService.getAllBrands();
        return new ResponseEntity<>(brands, HttpStatus.OK);
    }

    @GetMapping(params = "categoryId")
    public ResponseEntity<List<BrandResponse>> getBrandsByCategory(@RequestParam Long categoryId) {
        List<BrandResponse> brands = brandService.getBrandsByCategory(categoryId);
        return new ResponseEntity<>(brands, HttpStatus.OK);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createBrand(@Valid @RequestBody BrandRequest request) {
        try {
            BrandResponse brand = brandService.createBrand(request.getName(), request.getSlug());
            return new ResponseEntity<>(ApiResponse.created(brand), HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(
                    new ErrorResponse(HttpStatus.BAD_REQUEST.value(), "Conflict", e.getMessage()),
                    HttpStatus.BAD_REQUEST
            );
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateBrand(@PathVariable Long id, @Valid @RequestBody BrandRequest request) {
        try {
            BrandResponse brand = brandService.updateBrand(id, request.getName(), request.getSlug());
            return new ResponseEntity<>(ApiResponse.ok(brand), HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            if ("Brand not found".equals(e.getMessage())) {
                return new ResponseEntity<>(
                        new ErrorResponse(HttpStatus.NOT_FOUND.value(), "Not Found", e.getMessage()),
                        HttpStatus.NOT_FOUND
                );
            }
            return new ResponseEntity<>(
                    new ErrorResponse(HttpStatus.BAD_REQUEST.value(), "Conflict", e.getMessage()),
                    HttpStatus.BAD_REQUEST
            );
        }
    }
}
