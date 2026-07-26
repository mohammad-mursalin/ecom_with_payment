package com.mursalin.ecom.service.Impl;

import com.mursalin.ecom.dto.*;
import com.mursalin.ecom.exception.ResourceNotFoundException;
import com.mursalin.ecom.model.*;
import com.mursalin.ecom.repository.*;
import com.mursalin.ecom.service.ReviewService;

import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final ReviewVoteRepository reviewVoteRepository;
    private final ReviewImageRepository reviewImageRepository;
    private final UserRepository userRepository;
    private final ProductRepo productRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("MMMM d, yyyy");

    @Override
    public ReviewSummary getReviewSummary(Long productId) {
        Double avgRating = reviewRepository.getAverageRatingByProductId(productId);
        if (avgRating == null) avgRating = 0.0;
        long totalCount = reviewRepository.countByProductId(productId);

        Map<Integer, Long> distribution = new LinkedHashMap<>();
        for (int i = 1; i <= 5; i++) {
            distribution.put(i, 0L);
        }

        List<Review> allReviews = reviewRepository.findByProductId(productId, Pageable.unpaged()).getContent();
        for (Review review : allReviews) {
            int star = review.getRating();
            distribution.put(star, distribution.getOrDefault(star, 0L) + 1);
        }

        return new ReviewSummary(
                Math.round(avgRating * 10.0) / 10.0,
                totalCount,
                distribution
        );
    }

    @Override
    public PaginatedResponse<ReviewResponse> getReviews(Long productId, int page, int size, String sort, Integer minRating, Long currentUserId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        if ("helpful".equalsIgnoreCase(sort)) {
            pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));
        } else if ("highest".equalsIgnoreCase(sort)) {
            pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "rating"));
        } else if ("lowest".equalsIgnoreCase(sort)) {
            pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "rating"));
        }

        Page<Review> reviewPage;
        if (minRating != null && minRating >= 1 && minRating <= 5) {
            reviewPage = reviewRepository.findByProductIdAndRatingGreaterThanEqual(productId, minRating, pageable);
        } else {
            reviewPage = reviewRepository.findByProductId(productId, pageable);
        }

        List<ReviewResponse> content = reviewPage.getContent().stream()
                .map(review -> toReviewResponse(review, currentUserId))
                .collect(Collectors.toList());

        return new PaginatedResponse<>(
                content,
                reviewPage.getNumber(),
                reviewPage.getTotalPages(),
                reviewPage.getTotalElements(),
                reviewPage.getSize(),
                reviewPage.isFirst(),
                reviewPage.isLast()
        );
    }

    @Override
    public ReviewListResponse getProductReviewList(Long productId, int page, int size, String sort, Integer minRating, Long currentUserId) {
        PaginatedResponse<ReviewResponse> paginated = getReviews(productId, page, size, sort, minRating, currentUserId);
        ReviewSummary summary = getReviewSummary(productId);

        ReviewListResponse response = new ReviewListResponse();
        response.setSummary(summary);
        response.setContent(paginated.getContent());
        response.setTotalElements(paginated.getTotalElements());
        response.setTotalPages(paginated.getTotalPages());
        response.setCurrentPage(paginated.getCurrentPage());

        return response;
    }

    @Override
    public ReviewResponse getMyReview(Long productId, Long userId) {
        Review review = reviewRepository.findByUser_UserIdAndProductId(userId, productId)
                .orElse(null);
        if (review == null) return null;
        return toReviewResponse(review, userId);
    }

    @Override
    @Transactional
    public ReviewResponse createReview(Long userId, ReviewRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        boolean hasPurchased = orderItemRepository.existsDeliveredOrderItem(userId, request.getProductId());

        if (!hasPurchased) {
            throw new IllegalStateException("You must purchase and receive this product before reviewing");
        }

        if (reviewRepository.existsByUser_UserIdAndProductId(userId, request.getProductId())) {
            throw new IllegalStateException("You have already reviewed this product");
        }

        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + request.getOrderId()));

        Review review = new Review();
        review.setUser(user);
        review.setProduct(product);
        review.setOrder(order);
        review.setRating(request.getRating());
        review.setTitle(request.getTitle());
        review.setBody(request.getBody());
        review.setCreatedAt(LocalDateTime.now());
        review.setUpdatedAt(LocalDateTime.now());

        Review savedReview = reviewRepository.save(review);

        if (request.getImageUrls() != null && !request.getImageUrls().isEmpty()) {
            List<ReviewImage> images = request.getImageUrls().stream()
                    .map(url -> {
                        ReviewImage img = new ReviewImage();
                        img.setReview(savedReview);
                        img.setUrl(url);
                        img.setCreatedAt(LocalDateTime.now());
                        return img;
                    })
                    .collect(Collectors.toList());
            reviewImageRepository.saveAll(images);
        }

        return toReviewResponse(savedReview, userId);
    }

    @Override
    @Transactional
    public ReviewResponse updateReview(Long reviewId, Long userId, ReviewRequest request) {
        final Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found"));

        if (!review.getUser().getUserId().equals(userId)) {
            throw new AccessDeniedException("You can only edit your own reviews");
        }

        review.setRating(request.getRating());
        review.setTitle(request.getTitle());
        review.setBody(request.getBody());
        review.setUpdatedAt(LocalDateTime.now());

        if (request.getImageUrls() != null) {
            reviewImageRepository.deleteByReviewId(reviewId);
            List<ReviewImage> images = request.getImageUrls().stream()
                    .map(url -> {
                        ReviewImage img = new ReviewImage();
                        img.setReview(review);
                        img.setUrl(url);
                        img.setCreatedAt(LocalDateTime.now());
                        return img;
                    })
                    .collect(Collectors.toList());
            reviewImageRepository.saveAll(images);
        }

        Review saved = reviewRepository.save(review);
        return toReviewResponse(saved, userId);
    }

    @Override
    @Transactional
    public void deleteReview(Long reviewId, Long userId, boolean isAdmin) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found"));

        if (!isAdmin && !review.getUser().getUserId().equals(userId)) {
            throw new AccessDeniedException("You can only delete your own reviews");
        }

        reviewImageRepository.deleteByReviewId(reviewId);
        reviewVoteRepository.deleteByReviewId(reviewId);
        reviewRepository.delete(review);
    }

    @Override
    @Transactional
    public VoteResponse voteReview(Long reviewId, Long userId, String voteType) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found"));

        ReviewVoteType voteEnum = "HELPFUL".equalsIgnoreCase(voteType) ? ReviewVoteType.HELPFUL : ReviewVoteType.NOT_HELPFUL;

        Optional<ReviewVote> existingVote = reviewVoteRepository.findByReviewIdAndUser_UserId(reviewId, userId);
        if (existingVote.isPresent()) {
            ReviewVote vote = existingVote.get();
            if (vote.getVote() == voteEnum) {
                reviewVoteRepository.delete(vote);
            } else {
                vote.setVote(voteEnum);
                reviewVoteRepository.save(vote);
            }
        } else {
            User voter = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));
            ReviewVote newVote = new ReviewVote();
            newVote.setReview(review);
            newVote.setUser(voter);
            newVote.setVote(voteEnum);
            newVote.setCreatedAt(LocalDateTime.now());
            reviewVoteRepository.save(newVote);
        }

        long helpfulCount = reviewVoteRepository.countByReviewIdAndVote(reviewId, ReviewVoteType.HELPFUL);
        long notHelpfulCount = reviewVoteRepository.countByReviewIdAndVote(reviewId, ReviewVoteType.NOT_HELPFUL);

        String currentUserVote = null;
        Optional<ReviewVote> currentVote = reviewVoteRepository.findByReviewIdAndUser_UserId(reviewId, userId);
        if (currentVote.isPresent()) {
            currentUserVote = currentVote.get().getVote().name();
        }

        return new VoteResponse((int) helpfulCount, (int) notHelpfulCount, currentUserVote);
    }

    @Override
    @Transactional
    public void reportReview(Long reviewId, Long userId, String reason) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found"));

        if (review.getUser().getUserId().equals(userId)) {
            throw new IllegalStateException("You cannot report your own review");
        }

        System.out.println("Review reported: reviewId=" + reviewId + ", reportedBy=" + userId + ", reason=" + reason);
    }

    @Override
    public boolean hasPurchasedDelivered(Long userId, Long productId) {
        return orderItemRepository.existsDeliveredOrderItem(userId, productId);
    }

    private ReviewResponse toReviewResponse(Review review, Long currentUserId) {
        ReviewResponse response = new ReviewResponse();
        response.setId(review.getId());
        response.setUserId(review.getUser().getUserId());
        response.setUsername(review.getUser().getUsername());
        response.setUserInitial(String.valueOf(review.getUser().getUsername().charAt(0)).toUpperCase());
        response.setRating(review.getRating());
        response.setTitle(review.getTitle());
        response.setBody(review.getBody());
        response.setCreatedAt(review.getCreatedAt());

        long helpfulCount = reviewVoteRepository.countByReviewIdAndVote(review.getId(), ReviewVoteType.HELPFUL);
        long notHelpfulCount = reviewVoteRepository.countByReviewIdAndVote(review.getId(), ReviewVoteType.NOT_HELPFUL);
        response.setHelpfulCount((int) helpfulCount);
        response.setNotHelpfulCount((int) notHelpfulCount);

        if (currentUserId != null) {
            Optional<ReviewVote> voteOpt = reviewVoteRepository.findByReviewIdAndUser_UserId(review.getId(), currentUserId);
            response.setUserVote(voteOpt.map(v -> v.getVote().name()).orElse(null));
            response.setCanEdit(review.getUser().getUserId().equals(currentUserId));
        } else {
            response.setUserVote(null);
            response.setCanEdit(false);
        }

        List<ReviewImageResponse> images = reviewImageRepository.findByReviewId(review.getId()).stream()
                .map(img -> new ReviewImageResponse(img.getId(), img.getUrl(), img.getCreatedAt()))
                .collect(Collectors.toList());
        response.setImages(images);

        return response;
    }
}
