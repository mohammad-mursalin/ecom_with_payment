package com.mursalin.ecom.repository;

import com.mursalin.ecom.model.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long> {

    @Query("select c from CartItem c where c.user.userId = :userId")
    List<CartItem> findByUserId(@Param("userId") Long userId);

    @Query("select c from CartItem c where c.user.userId = :userId and c.product.id = :productId")
    Optional<CartItem> findByUserIdAndProductId(@Param("userId") Long userId, @Param("productId") Long productId);

    @Query("delete from CartItem c where c.user.userId = :userId")
    void deleteByUserId(@Param("userId") Long userId);
}
