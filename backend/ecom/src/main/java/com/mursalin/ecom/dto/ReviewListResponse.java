package com.mursalin.ecom.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ReviewListResponse {
    private ReviewSummary summary;
    private List<ReviewResponse> content;
    private long totalElements;
    private int totalPages;
    private int currentPage;
}
