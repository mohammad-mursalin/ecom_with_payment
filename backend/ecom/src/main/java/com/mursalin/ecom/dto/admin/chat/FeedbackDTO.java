package com.mursalin.ecom.dto.admin.chat;

import com.mursalin.ecom.model.ChatFeedbackRating;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class FeedbackDTO {
    private Long id;
    private ChatFeedbackRating rating;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
