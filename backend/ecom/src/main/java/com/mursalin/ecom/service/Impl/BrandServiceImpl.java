package com.mursalin.ecom.service.Impl;

import com.mursalin.ecom.dto.BrandResponse;
import com.mursalin.ecom.model.Brand;
import com.mursalin.ecom.model.Product;
import com.mursalin.ecom.repository.BrandRepository;
import com.mursalin.ecom.repository.ProductRepo;
import com.mursalin.ecom.service.BrandService;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BrandServiceImpl implements BrandService{

    private final BrandRepository brandRepository;
    private final ProductRepo productRepository;

    @Override
    public List<BrandResponse> getAllBrands() {
        return brandRepository.findAllByOrderByNameAsc().stream()
                .map(this::toBrandResponse)
                .collect(Collectors.toList());
    }
    @Override
    public List<BrandResponse> getBrandsByCategory(Long categoryId) {
        return productRepository.findByCategoryEntity_IdAndIsActiveTrueAndDeletedAtIsNull(categoryId)
                .stream()
                .map(Product::getBrandEntity)
                .filter(java.util.Objects::nonNull)
                .distinct()
                .sorted((a, b) -> a.getName().compareToIgnoreCase(b.getName()))
                .map(this::toBrandResponse)
                .collect(Collectors.toList());
    }
    @Override
    public BrandResponse createBrand(String name, String slug) {
        if (brandRepository.existsBySlug(slug)) {
            throw new IllegalArgumentException("Brand with this slug already exists");
        }
        Brand brand = new Brand();
        brand.setName(name);
        brand.setSlug(slug);
        brandRepository.save(brand);
        return toBrandResponse(brand);
    }
    @Override
    public BrandResponse updateBrand(Long id, String name, String slug) {
        Brand brand = brandRepository.findById(id).orElse(null);
        if (brand == null) {
            throw new IllegalArgumentException("Brand not found");
        }
        if (!brand.getSlug().equals(slug) && brandRepository.existsBySlug(slug)) {
            throw new IllegalArgumentException("Brand with this slug already exists");
        }
        brand.setName(name);
        brand.setSlug(slug);
        brandRepository.save(brand);
        return toBrandResponse(brand);
    }
    @Override
    public BrandResponse toBrandResponse(Brand brand) {
        return new BrandResponse(brand.getId(), brand.getName(), brand.getSlug());
    }
}
