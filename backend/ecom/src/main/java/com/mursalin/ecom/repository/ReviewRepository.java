package com.mursalin.ecom.repository;

import com.mursalin.ecom.model.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    Page<Review> findByProductId(Long productId, Pageable pageable);

    Page<Review> findByProductIdAndRatingGreaterThanEqual(Long productId, Integer rating, Pageable pageable);

    Optional<Review> findByUser_UserIdAndProductId(Long userId, Long productId);

    boolean existsByUser_UserIdAndProductId(Long userId, Long productId);

    long countByProductId(Long productId);

    @Query("select avg(r.rating) from Review r where r.product.id = :productId")
    Double getAverageRatingByProductId(Long productId);
}
