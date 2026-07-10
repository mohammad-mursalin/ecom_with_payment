package com.mursalin.ecom.service;

import com.mursalin.ecom.dto.CategoryResponse;
import com.mursalin.ecom.exception.ResourceNotFoundException;
import com.mursalin.ecom.model.Category;
import com.mursalin.ecom.model.Product;
import com.mursalin.ecom.repository.CategoryRepository;
import com.mursalin.ecom.repository.ProductRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductRepo productRepository;

    public List<CategoryResponse> getAllCategories() {
        return categoryRepository.findAllByOrderByNameAsc().stream()
                .map(this::toCategoryResponse)
                .collect(Collectors.toList());
    }

    public CategoryResponse createCategory(String name, String slug, String icon, String description, Long parentId) {
        if (categoryRepository.existsBySlug(slug)) {
            throw new IllegalArgumentException("Category with this slug already exists");
        }
        Category category = new Category();
        category.setName(name);
        category.setSlug(slug);
        category.setIcon(icon);
        category.setDescription(description);
        if (parentId != null) {
            Category parent = categoryRepository.findById(parentId)
                    .orElseThrow(() -> new ResourceNotFoundException("Parent category not found with id: " + parentId));
            category.setParent(parent);
        }
        categoryRepository.save(category);
        return toCategoryResponse(category);
    }

    public CategoryResponse updateCategory(Long id, String name, String slug, String icon, String description, Long parentId) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));
        if (!category.getSlug().equals(slug) && categoryRepository.existsBySlug(slug)) {
            throw new IllegalArgumentException("Category with this slug already exists");
        }
        category.setName(name);
        category.setSlug(slug);
        category.setIcon(icon);
        category.setDescription(description);
        if (parentId != null) {
            Category parent = categoryRepository.findById(parentId)
                    .orElseThrow(() -> new ResourceNotFoundException("Parent category not found with id: " + parentId));
            category.setParent(parent);
        } else {
            category.setParent(null);
        }
        categoryRepository.save(category);
        return toCategoryResponse(category);
    }

    public void deleteCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));
        List<Product> products = productRepository.findByCategoryEntity_Id(id, Pageable.unpaged()).getContent();
        if (products != null && !products.isEmpty()) {
            throw new IllegalArgumentException("Cannot delete category. It has associated products.");
        }
        categoryRepository.delete(category);
    }

    private CategoryResponse toCategoryResponse(Category category) {
        CategoryResponse response = new CategoryResponse();
        response.setId(category.getId());
        response.setName(category.getName());
        response.setSlug(category.getSlug());
        response.setIcon(category.getIcon());
        response.setDescription(category.getDescription());
        if (category.getParent() != null) {
            response.setParentId(category.getParent().getId());
        }
        return response;
    }
}
