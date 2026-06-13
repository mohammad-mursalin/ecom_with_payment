package com.mursalin.ecom.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ReviewSummary {
    private Double averageRating;
    private Long totalCount;
    private Map<Integer, Long> distribution;
}
