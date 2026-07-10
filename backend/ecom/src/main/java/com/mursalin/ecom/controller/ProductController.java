package com.mursalin.ecom.controller;

import com.mursalin.ecom.dto.AdminProductListResponse;
import com.mursalin.ecom.dto.AdminProductRequest;
import com.mursalin.ecom.dto.ApiResponse;
import com.mursalin.ecom.dto.PaginatedResponse;
import com.mursalin.ecom.dto.ProductResponse;
import com.mursalin.ecom.exception.ResourceNotFoundException;
import com.mursalin.ecom.model.Product;
import com.mursalin.ecom.model.UserPrinciples;
import com.mursalin.ecom.service.ProductService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.*;

@RestController
@RequestMapping("/api")
public class ProductController {

    private final ProductService service;

    public ProductController(ProductService service) {
        this.service = service;
    }

    @GetMapping("/products")
    public ResponseEntity<PaginatedResponse<ProductResponse>> getProducts(
            @AuthenticationPrincipal UserPrinciples userPrinciple,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "") String category,
            @RequestParam(defaultValue = "") String brand,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) Integer minRating,
            @RequestParam(defaultValue = "newest") String sort
    ) {
        Long userId = userPrinciple != null ? userPrinciple.getUserId() : null;
        List<String> categorySlugs = category.isEmpty() ? Collections.emptyList() : List.of(category.split(","));
        List<String> brandSlugs = brand.isEmpty() ? Collections.emptyList() : List.of(brand.split(","));
        PaginatedResponse<ProductResponse> result = service.getFilteredProducts(page, size, search, categorySlugs, brandSlugs, minPrice, maxPrice, minRating, sort, userId);
        return new ResponseEntity<>(result, HttpStatus.OK);
    }

    @GetMapping("/product/{prodId}")
    public ResponseEntity<ApiResponse<ProductResponse>> getProduct(
            @AuthenticationPrincipal UserPrinciples userPrinciple,
            @PathVariable Long prodId
    ) {
        Product product = service.getProductEntityById(prodId);
        if (product == null) {
            throw new ResourceNotFoundException("Product not found with id: " + prodId);
        }
        Long userId = userPrinciple != null ? userPrinciple.getUserId() : null;
        return ResponseEntity.ok(ApiResponse.ok(service.toProductResponse(product, userId)));
    }

    @GetMapping("/product/{productId}/related")
    public ResponseEntity<List<ProductResponse>> getRelatedProducts(@PathVariable Long productId) {
        List<ProductResponse> related = service.getRelatedProducts(productId);
        return new ResponseEntity<>(related, HttpStatus.OK);
    }

    @GetMapping("/product/{productId}/also-bought")
    public ResponseEntity<List<ProductResponse>> getAlsoBoughtProducts(@PathVariable Long productId) {
        List<ProductResponse> alsoBought = service.getAlsoBoughtProducts(productId);
        return new ResponseEntity<>(alsoBought, HttpStatus.OK);
    }

    @PostMapping("/product")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ProductResponse>> addProduct(
            @RequestPart AdminProductRequest request,
            @RequestPart(value = "imageFile", required = false) MultipartFile imageFile
    ) throws Exception {
        ProductResponse result = service.createAdminProduct(request, imageFile);
        return new ResponseEntity<>(ApiResponse.created(result), HttpStatus.CREATED);
    }

    @GetMapping("/product/{productId}/image")
    public ResponseEntity<String> getImage(@PathVariable Long productId) {
        Product product = service.getProductEntityById(productId);
        String imageUrl = product.getImageUrl();
        return ResponseEntity.ok().body(imageUrl);
    }

    @PutMapping("/product/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProductResponse> updateProduct(
            @PathVariable Long id,
            @RequestPart AdminProductRequest request,
            @RequestPart(value = "imageFile", required = false) MultipartFile imageFile
    ) throws Exception {
        return ResponseEntity.ok(service.updateAdminProduct(id, request, imageFile));
    }

    @DeleteMapping("/product/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> deleteProduct(@PathVariable Long id) {
        Product product = service.getProductEntityById(id);
        if (product != null) {
            service.deleteProduct(id);
            return new ResponseEntity<>(ApiResponse.success("deleted", "deleted"), HttpStatus.OK);
        } else {
            return new ResponseEntity<>(ApiResponse.success("delete failed", "delete failed"), HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/products/search")
    public ResponseEntity<PaginatedResponse<ProductResponse>> searchProduct(
            @AuthenticationPrincipal UserPrinciples userPrinciple,
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size
    ) {
        Long userId = userPrinciple != null ? userPrinciple.getUserId() : null;
        PaginatedResponse<ProductResponse> response = service.getFilteredProducts(page, size, keyword, Collections.emptyList(), Collections.emptyList(), null, null, null, "newest", userId);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping("/products/search/suggestions")
    public ResponseEntity<List<Map<String, Object>>> searchSuggestions(
            @AuthenticationPrincipal UserPrinciples userPrinciple,
            @RequestParam(defaultValue = "") String q,
            @RequestParam(defaultValue = "5") int limit
    ) {
        String query = q == null ? "" : q.trim().toLowerCase();
        if (query.isEmpty()) {
            return ResponseEntity.ok(Collections.emptyList());
        }

        Long userId = userPrinciple != null ? userPrinciple.getUserId() : null;
        List<ProductResponse> results = service.getFilteredProducts(0, limit, query, Collections.emptyList(), Collections.emptyList(), null, null, null, "newest", userId).getContent();
        List<Map<String, Object>> suggestions = new ArrayList<>();
        for (ProductResponse p : results) {
            if (suggestions.size() >= limit) break;
            Map<String, Object> map = new HashMap<>();
            map.put("id", p.getId());
            map.put("name", p.getName());
            ProductResponse.CategoryInfo categoryInfo = p.getCategory();
            if (categoryInfo != null) {
                Map<String, Object> categoryMap = new HashMap<>();
                categoryMap.put("name", categoryInfo.getName());
                categoryMap.put("slug", categoryInfo.getSlug());
                map.put("category", categoryMap);
            } else {
                map.put("category", Collections.emptyMap());
            }
            map.put("price", p.getPrice());
            String primaryImage = p.getImages() != null && !p.getImages().isEmpty() ? p.getImages().get(0).getUrl() : null;
            map.put("imageUrl", primaryImage);
            suggestions.add(map);
        }
        return ResponseEntity.ok(suggestions);
    }

    @GetMapping("/admin/products")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PaginatedResponse<AdminProductListResponse>> getAdminProducts(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(service.getAdminProducts(keyword, page, size));
    }

    @PostMapping("/admin/products")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProductResponse> createAdminProduct(
            @RequestPart AdminProductRequest request,
            @RequestPart(value = "imageFile", required = false) MultipartFile imageFile
    ) throws Exception {
        return ResponseEntity.ok(service.createAdminProduct(request, imageFile));
    }

    @PutMapping("/admin/products/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProductResponse> updateAdminProduct(
            @PathVariable Long id,
            @RequestPart AdminProductRequest request,
            @RequestPart(value = "imageFile", required = false) MultipartFile imageFile
    ) throws Exception {
        return ResponseEntity.ok(service.updateAdminProduct(id, request, imageFile));
    }
}
