package com.mursalin.ecom.dto;

import com.mursalin.ecom.model.KbTopic;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class KbArticleResponse {
    private KbTopic topic;
    private String content;
    private LocalDateTime updatedAt;
}
