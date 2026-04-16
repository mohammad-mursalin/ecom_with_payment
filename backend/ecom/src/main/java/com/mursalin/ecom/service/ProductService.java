package com.mursalin.ecom.service;

import com.mursalin.ecom.dto.ImageResponse;
import com.mursalin.ecom.model.Product;
import com.mursalin.ecom.repository.ProductRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Service
public class ProductService {

    @Autowired
    ProductRepo repo;

    @Autowired
    ImageService imageService;

    public List<Product> getProducts() {
        System.out.println(repo.findAll());
        return repo.findAll();
    }

    public Product getProductById(int prodId) {
        return repo.findById(prodId).orElse(null);
    }

    public Product addProduct(Product product, MultipartFile imageFile) throws IOException {

        try {

            if (imageFile != null && !imageFile.isEmpty()) {
                ImageResponse image = imageService.uploadImage(imageFile);
                product.setImageUrl(image.getImageUrl());
                product.setDeleteHash(image.getDeleteHash());
                System.out.println(image);
                System.out.println("delete hash : " +image.getDeleteHash());
            }

        } catch (IOException e) {
            throw new RuntimeException("Error while processing the product image");
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
        try {
            if (imageFile != null && !imageFile.isEmpty()) {
                imageService.deleteImage(productDB.getDeleteHash());
                ImageResponse image = imageService.uploadImage(imageFile);
                productDB.setImageUrl(image.getImageUrl());
                productDB.setDeleteHash(image.getDeleteHash());
            }

        } catch (IOException e) {
            throw new RuntimeException("Error while updating the complaint image");
        }

        return repo.save(productDB);
    }

    public void deleteProduct(int id) {
        Product product = repo.findById(id).orElseThrow(() -> new RuntimeException("No product found with the id"));
        imageService.deleteImage(product.getDeleteHash());
        repo.deleteById(id);
    }

    public List<Product> searchProduct(String keyword) {

        List<Product> products = repo.searchProductByKeyword(keyword);
        return products;
    }
}
