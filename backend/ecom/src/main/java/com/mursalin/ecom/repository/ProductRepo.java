package com.mursalin.ecom.repository;

import com.mursalin.ecom.model.Brand;
import com.mursalin.ecom.model.Category;
import com.mursalin.ecom.model.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface ProductRepo extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {

    Page<Product> findByCategoryEntity_Id(Long categoryId, Pageable pageable);

    Page<Product> findByIsFeaturedTrueAndIsActiveTrueOrderByCreatedAtDesc(Pageable pageable);

    @Query("select distinct p.brandEntity.name from Product p where p.brandEntity is not null and p.isActive = true")
    List<String> findDistinctBrands();

    Page<Product> findByDeletedAtIsNull(Pageable pageable);

    @Query("select product from Product product where " +
            "(:keyword is null or :keyword = '' or " +
            " lower(product.name) like lower(concat('%',:keyword,'%')) or " +
            " lower(product.description) like lower(concat('%',:keyword,'%')) or " +
            " lower(product.brandEntity.name) like lower(concat('%',:keyword,'%')) or " +
            " lower(product.categoryEntity.name) like lower(concat('%',:keyword,'%')))")
    Page<Product> findWithFilters(@Param("keyword") String keyword, Pageable pageable);

    Page<Product> findAll(Pageable pageable);

    Page<Product> findByIsActiveTrueAndDeletedAtIsNull(Pageable pageable);

    List<Product> findByBrandEntity_IdAndIsActiveTrueAndDeletedAtIsNull(Long brandId);

    List<Product> findByCategoryEntity_IdAndIsActiveTrueAndDeletedAtIsNull(Long categoryId);

    long countByDeletedAtIsNull();

    long countByIsActiveTrueAndDeletedAtIsNull();

    long countByIsActiveTrueAndDeletedAtIsNullAndStockQuantityLessThanEqual(Long stockThreshold);

    @Query("select count(p) from Product p where p.deletedAt is null and p.isActive = true and p.stockQuantity <= p.lowStockThreshold")
    long countLowStock();

    @Query("SELECT p FROM Product p LEFT JOIN p.brandEntity b LEFT JOIN p.categoryEntity c " +
           "WHERE p.deletedAt IS NULL " +
           "AND (:keyword IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%',:keyword,'%')) " +
           "OR LOWER(b.name) LIKE LOWER(CONCAT('%',:keyword,'%')) " +
           "OR LOWER(c.name) LIKE LOWER(CONCAT('%',:keyword,'%')))")
    Page<Product> findAdminProducts(@Param("keyword") String keyword, Pageable pageable);

@Query("select p from Product p where p.deletedAt is null and p.isActive = true and p.stockQuantity <= p.lowStockThreshold")
    Page<Product> findLowStock(Pageable pageable);

    @Query("select p from Product p where p.deletedAt is null and p.isActive = true and " +
            "(:categoryIds is null or p.categoryEntity.id in :categoryIds) and " +
            "(:brandIds is null or p.brandEntity.id in :brandIds) and " +
            "(:minRating is null or :minRating <= 0 or 1 = 1)")
    Page<Product> filterByCategoryBrandRating(@Param("categoryIds") List<Long> categoryIds,
                                             @Param("brandIds") List<Long> brandIds,
                                             @Param("minRating") Integer minRating,
                                             Pageable pageable);
}
