package com.mursalin.ecom.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ReviewResponse {
    private Long id;
    private Long userId;
    private String username;
    private String userInitial;
    private Integer rating;
    private String title;
    private String body;
    private LocalDateTime createdAt;
    private Integer helpfulCount;
    private Integer notHelpfulCount;
    private String userVote;
    private Boolean canEdit;
    private List<ReviewImageResponse> images;
}
