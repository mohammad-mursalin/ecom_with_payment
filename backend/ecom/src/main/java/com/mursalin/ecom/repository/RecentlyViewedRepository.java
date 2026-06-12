package com.mursalin.ecom.repository;

import com.mursalin.ecom.model.RecentlyViewed;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecentlyViewedRepository extends JpaRepository<RecentlyViewed, Long> {

    @Query("select rv from RecentlyViewed rv where rv.user.userId = :userId order by rv.viewedAt desc")
    Page<RecentlyViewed> findByUserIdOrderByViewedAtDesc(@Param("userId") Long userId, Pageable pageable);

    @Query("select rv from RecentlyViewed rv where rv.user.userId = :userId and rv.product.id = :productId")
    java.util.Optional<RecentlyViewed> findByUserIdAndProductId(@Param("userId") Long userId, @Param("productId") Long productId);

    @Query("SELECT rv FROM RecentlyViewed rv WHERE rv.user.userId = :userId ORDER BY rv.viewedAt ASC")
    List<RecentlyViewed> findOldestByUser(@Param("userId") Long userId);

    int countByUser_UserId(Long userId);
}
