package com.mursalin.ecom.controller;

import com.mursalin.ecom.dto.*;
import com.mursalin.ecom.model.UserPrinciples;
import com.mursalin.ecom.service.ReviewService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @PostMapping
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<ReviewResponse>> createReview(
            @AuthenticationPrincipal UserPrinciples userPrinciple,
            @Valid @RequestBody ReviewRequest request
    ) {
        ReviewResponse response = reviewService.createReview(userPrinciple.getUserId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response, "Review submitted successfully"));
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<ApiResponse<ReviewListResponse>> getProductReviews(
            @AuthenticationPrincipal UserPrinciples userPrinciple,
            @PathVariable Long productId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size,
            @RequestParam(defaultValue = "newest") String sort,
            @RequestParam(required = false) Integer minRating
    ) {
        Long userId = userPrinciple != null ? userPrinciple.getUserId() : null;
        ReviewListResponse listResponse = reviewService.getProductReviewList(productId, page, size, sort, minRating, userId);
        return ResponseEntity.ok(ApiResponse.success(listResponse));
    }

    @GetMapping("/my-review/{productId}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<ReviewResponse>> getMyReview(
            @AuthenticationPrincipal UserPrinciples userPrinciple,
            @PathVariable Long productId
    ) {
        ReviewResponse response = reviewService.getMyReview(productId, userPrinciple.getUserId());
        if (response == null) {
            return ResponseEntity.ok(ApiResponse.success(null));
        }
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/check-eligibility/{productId}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<Boolean>> checkEligibility(
            @AuthenticationPrincipal UserPrinciples userPrinciple,
            @PathVariable Long productId
    ) {
        boolean eligible = reviewService.hasPurchasedDelivered(userPrinciple.getUserId(), productId);
        return ResponseEntity.ok(ApiResponse.success(eligible));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<ReviewResponse>> updateReview(
            @AuthenticationPrincipal UserPrinciples userPrinciple,
            @PathVariable Long id,
            @Valid @RequestBody ReviewRequest request
    ) {
        ReviewResponse response = reviewService.updateReview(id, userPrinciple.getUserId(), request);
        return ResponseEntity.ok(ApiResponse.success(response, "Review updated successfully"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<String>> deleteReview(
            @AuthenticationPrincipal UserPrinciples userPrinciple,
            @PathVariable Long id
    ) {
        reviewService.deleteReview(id, userPrinciple.getUserId(), false);
        return ResponseEntity.ok(ApiResponse.success("Review deleted successfully"));
    }

    @PostMapping("/{id}/vote")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<VoteResponse>> voteReview(
            @AuthenticationPrincipal UserPrinciples userPrinciple,
            @PathVariable Long id,
            @Valid @RequestBody VoteRequest request
    ) {
        VoteResponse voteResponse = reviewService.voteReview(id, userPrinciple.getUserId(), request.getVote());
        return ResponseEntity.ok(ApiResponse.success(voteResponse));
    }

    @PostMapping("/{id}/report")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<String>> reportReview(
            @AuthenticationPrincipal UserPrinciples userPrinciple,
            @PathVariable Long id,
            @Valid @RequestBody ReportReviewRequest request
    ) {
        reviewService.reportReview(id, userPrinciple.getUserId(), request.getReason());
        return ResponseEntity.ok(ApiResponse.success("Review reported successfully"));
    }
}
