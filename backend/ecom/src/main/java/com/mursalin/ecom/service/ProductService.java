package com.mursalin.ecom.service;

import com.mursalin.ecom.dto.ImageResponse;
import com.mursalin.ecom.dto.PaginatedResponse;
import com.mursalin.ecom.model.Product;
import com.mursalin.ecom.repository.ProductRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.stream.Collectors;

@Service
public class ProductService {

    @Autowired
    ProductRepo repo;

    @Autowired
    ImageService imageService;

    public PaginatedResponse<Product> getProducts(int page, int size, String keyword, String category) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Product> productPage = repo.findWithFilters(normalize(keyword), category, pageable);
        return buildPaginatedResponse(productPage, page, size);
    }

    public Product getProductById(int prodId) {
        return repo.findById(prodId).orElse(null);
    }

    public Product addProduct(Product product, MultipartFile imageFile) throws IOException {
        if (imageFile != null && !imageFile.isEmpty()) {
            ImageResponse image = imageService.uploadImage(imageFile);
            product.setImageUrl(image.getImageUrl());
            product.setDeleteHash(image.getDeleteHash());
        }
        return repo.save(product);
    }

    public Product updateProduct(int id, Product product, MultipartFile imageFile) throws IOException {
        Product productDB = repo.findById(id).orElseThrow(RuntimeException::new);
        productDB.setProductAvailable(product.isProductAvailable());
        productDB.setName(product.getName());
        productDB.setBrand(product.getBrand());
        productDB.setCategory(product.getCategory());
        productDB.setPrice(product.getPrice());
        productDB.setDescription(product.getDescription());
        productDB.setReleaseDate(product.getReleaseDate());
        productDB.setStockQuantity(product.getStockQuantity());
        if (imageFile != null && !imageFile.isEmpty()) {
            imageService.deleteImage(productDB.getDeleteHash());
            ImageResponse image = imageService.uploadImage(imageFile);
            productDB.setImageUrl(image.getImageUrl());
            productDB.setDeleteHash(image.getDeleteHash());
        }
        return repo.save(productDB);
    }

    public void deleteProduct(int id) {
        Product product = repo.findById(id).orElseThrow(() -> new RuntimeException("No product found with the id"));
        imageService.deleteImage(product.getDeleteHash());
        repo.deleteById(id);
    }

    public PaginatedResponse<Product> searchProduct(String keyword, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Product> productPage = repo.searchProductByKeywordPaged(normalize(keyword), pageable);
        return buildPaginatedResponse(productPage, page, size);
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim();
    }

    private PaginatedResponse<Product> buildPaginatedResponse(Page<Product> productPage, int page, int size) {
        return new PaginatedResponse<>(
                productPage.getContent(),
                page,
                productPage.getTotalPages(),
                productPage.getTotalElements(),
                size,
                !productPage.hasPrevious(),
                !productPage.hasNext()
        );
    }
}
