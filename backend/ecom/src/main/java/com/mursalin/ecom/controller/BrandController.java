package com.mursalin.ecom.controller;

import com.mursalin.ecom.dto.BrandRequest;
import com.mursalin.ecom.dto.BrandResponse;
import com.mursalin.ecom.dto.CategoryResponse;
import com.mursalin.ecom.model.Brand;
import com.mursalin.ecom.model.Product;
import com.mursalin.ecom.repository.BrandRepository;
import com.mursalin.ecom.repository.ProductRepo;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@CrossOrigin
@RequestMapping("/api/brands")
public class BrandController {

    private final BrandRepository brandRepository;
    private final ProductRepo productRepository;

    public BrandController(BrandRepository brandRepository, ProductRepo productRepository) {
        this.brandRepository = brandRepository;
        this.productRepository = productRepository;
    }

    @GetMapping
    public ResponseEntity<List<BrandResponse>> getAllBrands() {
        List<BrandResponse> brands = brandRepository.findAllByOrderByNameAsc()
                .stream()
                .map(this::toBrandResponse)
                .collect(Collectors.toList());
        return new ResponseEntity<>(brands, HttpStatus.OK);
    }

    @GetMapping(params = "categoryId")
    public ResponseEntity<List<BrandResponse>> getBrandsByCategory(@RequestParam Long categoryId) {
        List<Product> products = productRepository.findByCategoryEntity_IdAndIsActiveTrueAndDeletedAtIsNull(categoryId);
        List<BrandResponse> brands = products.stream()
                .map(Product::getBrandEntity)
                .filter(java.util.Objects::nonNull)
                .distinct()
                .sorted((a, b) -> a.getName().compareToIgnoreCase(b.getName()))
                .map(this::toBrandResponse)
                .collect(Collectors.toList());
        return new ResponseEntity<>(brands, HttpStatus.OK);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createBrand(@Valid @RequestBody BrandRequest request) {
        if (brandRepository.existsBySlug(request.getSlug())) {
            return new ResponseEntity<>("Brand with this slug already exists", HttpStatus.BAD_REQUEST);
        }
        Brand brand = new Brand();
        brand.setName(request.getName());
        brand.setSlug(request.getSlug());
        brandRepository.save(brand);
        return new ResponseEntity<>(toBrandResponse(brand), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateBrand(@PathVariable Long id, @Valid @RequestBody BrandRequest request) {
        Brand brand = brandRepository.findById(id).orElse(null);
        if (brand == null) {
            return new ResponseEntity<>("Brand not found", HttpStatus.NOT_FOUND);
        }
        if (!brand.getSlug().equals(request.getSlug()) && brandRepository.existsBySlug(request.getSlug())) {
            return new ResponseEntity<>("Brand with this slug already exists", HttpStatus.BAD_REQUEST);
        }
        brand.setName(request.getName());
        brand.setSlug(request.getSlug());
        brandRepository.save(brand);
        return new ResponseEntity<>(toBrandResponse(brand), HttpStatus.OK);
    }

    private BrandResponse toBrandResponse(Brand brand) {
        return new BrandResponse(brand.getId(), brand.getName(), brand.getSlug());
    }
}
