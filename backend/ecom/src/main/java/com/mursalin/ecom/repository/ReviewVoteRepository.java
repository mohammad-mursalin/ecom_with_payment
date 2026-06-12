package com.mursalin.ecom.repository;

import com.mursalin.ecom.model.ReviewVote;
import com.mursalin.ecom.model.ReviewVoteType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewVoteRepository extends JpaRepository<ReviewVote, Long> {

    Optional<ReviewVote> findByReviewIdAndUser_UserId(Long reviewId, Long userId);

    long countByReviewIdAndVote(Long reviewId, ReviewVoteType vote);

    List<ReviewVote> findByReviewId(Long reviewId);

    void deleteByReviewId(Long reviewId);

    void deleteByReviewIdAndUser_UserId(Long reviewId, Long userId);
}
