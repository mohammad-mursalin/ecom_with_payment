package com.mursalin.ecom.repository;

import com.mursalin.ecom.model.Brand;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BrandRepository extends JpaRepository<Brand, Long> {

    Brand findBySlug(String slug);

    List<Brand> findAllByOrderByNameAsc();

    boolean existsBySlug(String slug);
}
