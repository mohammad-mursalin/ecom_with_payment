package com.mursalin.ecom.dto.chat;

import com.mursalin.ecom.model.ChatFeedbackRating;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FeedbackRequest {

    @NotBlank(message = "sessionToken is required")
    private String sessionToken;

    @NotNull(message = "rating is required")
    private ChatFeedbackRating rating;
}
