package com.mursalin.ecom.service;

import com.mursalin.ecom.dto.CategoryResponse;

import java.util.List;

public interface CategoryService {
    List<CategoryResponse> getAllCategories();

    CategoryResponse createCategory(String name, String slug, String icon, String description, Long parentId);

    CategoryResponse updateCategory(Long id, String name, String slug, String icon, String description, Long parentId);

    void deleteCategory(Long id);
}
