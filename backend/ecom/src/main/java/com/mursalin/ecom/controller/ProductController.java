package com.mursalin.ecom.controller;

import com.mursalin.ecom.model.Product;
import com.mursalin.ecom.service.ProductService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;

@RestController
@CrossOrigin
@RequestMapping("/api")
public class ProductController {

    private ProductService service;

    public ProductController(ProductService service) {
        this.service = service;
    }

    @RequestMapping("/")
    public String greet() {
        return "assalamualaikum";
    }

    @GetMapping("/products")
    public ResponseEntity<List<Product>> getProducts() {
        return new ResponseEntity<>(service.getProducts(), HttpStatus.OK);
    }

    @GetMapping("/product/{prodId}")
    public ResponseEntity<Product> getProduct(@PathVariable int prodId) {
        Product product = service.getProductById(prodId);
        if (product != null)
            return new ResponseEntity<>(product, HttpStatus.OK);
        else
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    @PostMapping("/product")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> addProduct(@RequestPart Product product, @RequestPart(required = false) MultipartFile imageFile) {
        try {
            return new ResponseEntity<>(service.addProduct(product, imageFile), HttpStatus.CREATED);
        } catch (Exception e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/product/{productId}/image")
    public ResponseEntity<String> getImage(@PathVariable int productId) {
        Product product = service.getProductById(productId);
        String imageUrl = product.getImageUrl();
        return ResponseEntity.ok().body(imageUrl);
    }

    @PutMapping("/product/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> updateProduct(@PathVariable int id, @RequestPart Product product, @RequestPart(required = false) MultipartFile imageFile) {
        try {
            Product updated = service.updateProduct(id, product, imageFile);
            if (updated != null) {
                return new ResponseEntity<>("product updated", HttpStatus.OK);
            } else {
                return new ResponseEntity<>("product update failed", HttpStatus.BAD_REQUEST);
            }
        } catch (Exception e) {
            return new ResponseEntity<>("product update failed", HttpStatus.BAD_REQUEST);
        }
    }

    @DeleteMapping("/product/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> deleteProduct(@PathVariable int id) {
        Product product = service.getProductById(id);
        if (product != null) {
            service.deleteProduct(id);
            return new ResponseEntity<>("deleted", HttpStatus.OK);
        } else {
            return new ResponseEntity<>("delete failed", HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/products/search")
    public ResponseEntity<List<Product>> searchProduct(@RequestParam String keyword) {
        List<Product> products = service.searchProduct(keyword);
        return new ResponseEntity<>(products, HttpStatus.OK);
    }
}
