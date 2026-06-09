package com.mursalin.ecom.repository;

import com.mursalin.ecom.model.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepo extends JpaRepository<Product, Integer> {

    @Query("select product from Product product where " +
            "lower(product.name) like lower(concat('%',:keyword,'%')) or " +
            "lower(product.description) like lower(concat('%',:keyword,'%')) or " +
            "lower(product.brand) like lower(concat('%',:keyword,'%')) or " +
            "lower(product.category) like lower(concat('%',:keyword,'%'))")
    List<Product> searchProductByKeyword(String keyword);

    @Query("select product from Product product where " +
            "lower(product.name) like lower(concat('%',:keyword,'%')) or " +
            "lower(product.description) like lower(concat('%',:keyword,'%')) or " +
            "lower(product.brand) like lower(concat('%',:keyword,'%')) or " +
            "lower(product.category) like lower(concat('%',:keyword,'%'))")
    Page<Product> searchProductByKeywordPaged(@Param("keyword") String keyword, Pageable pageable);

    Page<Product> findAll(Pageable pageable);

    @Query("select product from Product product where " +
            "(:keyword is null or :keyword = '' or " +
            " lower(product.name) like lower(concat('%',:keyword,'%')) or " +
            " lower(product.description) like lower(concat('%',:keyword,'%')) or " +
            " lower(product.brand) like lower(concat('%',:keyword,'%')) or " +
            " lower(product.category) like lower(concat('%',:keyword,'%'))) and " +
            "(:category is null or :category = '' or lower(product.category) = lower(:category))")
    Page<Product> findWithFilters(@Param("keyword") String keyword, @Param("category") String category, Pageable pageable);
}
