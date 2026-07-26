package com.mursalin.ecom.service;

import com.mursalin.ecom.dto.*;
import com.mursalin.ecom.model.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.List;

public interface ProductService {
    PaginatedResponse<ProductResponse> getProducts(int page, int size, String keyword, String category, Long userId);

    PaginatedResponse<ProductResponse> getFilteredProducts(int page, int size, String search, List<String> categorySlugs, List<String> brandSlugs, BigDecimal minPrice, BigDecimal maxPrice, Integer minRating, String sort, Long userId);

    ProductResponse getProductById(Long prodId);

    Product getProductEntityById(Long prodId);

    List<ProductResponse> getRelatedProducts(Long productId);

    List<ProductResponse> getAlsoBoughtProducts(Long productId);

    Product addProduct(Product product, MultipartFile imageFile) throws IOException;

    Product updateProduct(Long id, Product product, MultipartFile imageFile) throws IOException;

    void deleteProduct(Long id);

    PaginatedResponse<AdminProductListResponse> getAdminProducts(String search, int page, int pageSize);

    AdminProductListResponse toAdminProductListResponse(Product product);

    ProductResponse createAdminProduct(AdminProductRequest request, MultipartFile imageFile) throws Exception;

    ProductResponse updateAdminProduct(Long id, AdminProductRequest request, MultipartFile imageFile) throws Exception;

    ProductResponse toggleProductStatus(Long id, boolean isActive);

    PaginatedResponse<Product> searchProduct(String keyword, int page, int size);

    List<ProductResponse> getFeaturedProducts(int size);

    ProductResponse toProductResponse(Product product, boolean isWishlisted);

    ProductResponse toProductResponse(Product product, Long userId);
}
