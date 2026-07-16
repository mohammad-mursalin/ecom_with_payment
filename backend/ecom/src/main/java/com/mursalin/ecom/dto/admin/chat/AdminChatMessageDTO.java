package com.mursalin.ecom.dto.admin.chat;

import com.mursalin.ecom.model.ChatFeedbackRating;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class AdminChatMessageDTO {
    private Long id;
    private String role;
    private String content;
    private boolean isEscalation;
    private LocalDateTime createdAt;
    private FeedbackDTO feedback;
}
