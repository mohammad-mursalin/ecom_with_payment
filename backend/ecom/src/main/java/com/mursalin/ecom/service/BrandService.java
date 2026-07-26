package com.mursalin.ecom.service;

import com.mursalin.ecom.dto.BrandResponse;
import com.mursalin.ecom.model.Brand;

import java.util.List;

public interface BrandService {
    List<BrandResponse> getAllBrands();

    List<BrandResponse> getBrandsByCategory(Long categoryId);

    BrandResponse createBrand(String name, String slug);

    BrandResponse updateBrand(Long id, String name, String slug);

    BrandResponse toBrandResponse(Brand brand);
}
