package com.mursalin.ecom.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "product_specs")
@Data
public class ProductSpec {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "spec_key", nullable = false, length = 100)
    private String specKey;

    @Column(name = "spec_value", nullable = false, length = 500)
    private String specValue;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public ProductSpec() {
    }

    public ProductSpec(Long id, Product product, String specKey, String specValue) {
        this.id = id;
        this.product = product;
        this.specKey = specKey;
        this.specValue = specValue;
    }
}
