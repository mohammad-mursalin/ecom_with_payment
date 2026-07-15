package com.mursalin.ecom.dto.chat;

import com.mursalin.ecom.model.ChatFeedbackRating;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FeedbackResponse {

    private Long id;
    private Long messageId;
    private ChatFeedbackRating rating;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
