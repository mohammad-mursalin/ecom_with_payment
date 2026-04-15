package com.mursalin.ecom.repository;

import com.mursalin.ecom.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
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
}
