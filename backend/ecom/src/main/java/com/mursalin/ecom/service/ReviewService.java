package com.mursalin.ecom.service;

import com.mursalin.ecom.dto.PaginatedResponse;
import com.mursalin.ecom.dto.ReviewListResponse;
import com.mursalin.ecom.dto.ReviewRequest;
import com.mursalin.ecom.dto.ReviewResponse;
import com.mursalin.ecom.dto.ReviewSummary;
import com.mursalin.ecom.dto.VoteResponse;

public interface ReviewService {
    ReviewSummary getReviewSummary(Long productId);

    PaginatedResponse<ReviewResponse> getReviews(Long productId, int page, int size, String sort, Integer minRating, Long currentUserId);

    ReviewListResponse getProductReviewList(Long productId, int page, int size, String sort, Integer minRating, Long currentUserId);

    ReviewResponse getMyReview(Long productId, Long userId);

    ReviewResponse createReview(Long userId, ReviewRequest request);

    ReviewResponse updateReview(Long reviewId, Long userId, ReviewRequest request);

    void deleteReview(Long reviewId, Long userId, boolean isAdmin);

    VoteResponse voteReview(Long reviewId, Long userId, String voteType);

    void reportReview(Long reviewId, Long userId, String reason);

    boolean hasPurchasedDelivered(Long userId, Long productId);
}
