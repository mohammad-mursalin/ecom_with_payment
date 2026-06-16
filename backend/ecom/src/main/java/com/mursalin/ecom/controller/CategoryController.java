package com.mursalin.ecom.controller;

import com.mursalin.ecom.dto.ApiResponse;
import com.mursalin.ecom.dto.CategoryRequest;
import com.mursalin.ecom.dto.CategoryResponse;
import com.mursalin.ecom.exception.ResourceNotFoundException;
import com.mursalin.ecom.model.Category;
import com.mursalin.ecom.model.Product;
import com.mursalin.ecom.repository.CategoryRepository;
import com.mursalin.ecom.repository.ProductRepo;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryRepository categoryRepository;
    private final ProductRepo productRepository;

    public CategoryController(CategoryRepository categoryRepository, ProductRepo productRepository) {
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getAllCategories() {
        List<CategoryResponse> categories = categoryRepository.findAllByOrderByNameAsc()
                .stream()
                .map(this::toCategoryResponse)
                .collect(Collectors.toList());
        return new ResponseEntity<>(ApiResponse.ok(categories), HttpStatus.OK);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CategoryResponse>> createCategory(@Valid @RequestBody CategoryRequest request) {
        if (categoryRepository.existsBySlug(request.getSlug())) {
            throw new IllegalArgumentException("Category with this slug already exists");
        }
        Category category = new Category();
        category.setName(request.getName());
        category.setSlug(request.getSlug());
        category.setIcon(request.getIcon());
        category.setDescription(request.getDescription());
        if (request.getParentId() != null) {
            Category parent = categoryRepository.findById(request.getParentId()).orElse(null);
            if (parent == null) {
                throw new ResourceNotFoundException("Parent category not found with id: " + request.getParentId());
            }
            category.setParent(parent);
        }
        categoryRepository.save(category);
        return new ResponseEntity<>(ApiResponse.created(toCategoryResponse(category)), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CategoryResponse>> updateCategory(@PathVariable Long id, @Valid @RequestBody CategoryRequest request) {
        Category category = categoryRepository.findById(id).orElse(null);
        if (category == null) {
            throw new ResourceNotFoundException("Category not found with id: " + id);
        }
        if (!category.getSlug().equals(request.getSlug()) && categoryRepository.existsBySlug(request.getSlug())) {
            throw new IllegalArgumentException("Category with this slug already exists");
        }
        category.setName(request.getName());
        category.setSlug(request.getSlug());
        category.setIcon(request.getIcon());
        category.setDescription(request.getDescription());
        if (request.getParentId() != null) {
            Category parent = categoryRepository.findById(request.getParentId()).orElse(null);
            if (parent == null) {
                throw new ResourceNotFoundException("Parent category not found with id: " + request.getParentId());
            }
            category.setParent(parent);
        } else {
            category.setParent(null);
        }
        categoryRepository.save(category);
        return new ResponseEntity<>(ApiResponse.ok(toCategoryResponse(category), "Category updated successfully"), HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(@PathVariable Long id) {
        Category category = categoryRepository.findById(id).orElse(null);
        if (category == null) {
            throw new ResourceNotFoundException("Category not found with id: " + id);
        }
        List<Product> products = productRepository.findByCategoryEntity_Id(id, Pageable.unpaged()).getContent();
        if (products != null && !products.isEmpty()) {
            throw new IllegalArgumentException("Cannot delete category. It has associated products.");
        }
        categoryRepository.delete(category);
        return ResponseEntity.ok(ApiResponse.ok(null, "Category deleted successfully"));
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
