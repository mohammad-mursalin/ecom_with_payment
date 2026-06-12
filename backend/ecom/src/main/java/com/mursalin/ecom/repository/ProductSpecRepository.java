package com.mursalin.ecom.repository;

import com.mursalin.ecom.model.ProductSpec;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductSpecRepository extends JpaRepository<ProductSpec, Long> {

    List<ProductSpec> findByProductId(Long productId);

    void deleteByProductId(Long productId);
}
