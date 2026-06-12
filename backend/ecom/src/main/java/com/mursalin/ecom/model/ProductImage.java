package com.mursalin.ecom.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "product_images")
@Data
public class ProductImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false, length = 500)
    private String url;

    @Column(name = "sort_order")
    private Integer sortOrder;

    @Column(name = "is_primary")
    private boolean isPrimary = false;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public ProductImage() {
    }

    public ProductImage(Long id, Product product, String url, Integer sortOrder, boolean isPrimary) {
        this.id = id;
        this.product = product;
        this.url = url;
        this.sortOrder = sortOrder;
        this.isPrimary = isPrimary;
    }
}
