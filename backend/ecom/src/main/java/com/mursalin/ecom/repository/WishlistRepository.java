package com.mursalin.ecom.repository;

import com.mursalin.ecom.model.Wishlist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WishlistRepository extends JpaRepository<Wishlist, Long> {

    @Query("select w from Wishlist w where w.user.userId = :userId")
    List<Wishlist> findByUserId(@Param("userId") Long userId);

    @Query("select w from Wishlist w where w.user.userId = :userId and w.product.id = :productId")
    Optional<Wishlist> findByUserIdAndProductId(@Param("userId") Long userId, @Param("productId") Long productId);

    @Query("select case when count(w) > 0 then true else false end from Wishlist w where w.user.userId = :userId and w.product.id = :productId")
    boolean existsByUserIdAndProductId(@Param("userId") Long userId, @Param("productId") Long productId);
}
