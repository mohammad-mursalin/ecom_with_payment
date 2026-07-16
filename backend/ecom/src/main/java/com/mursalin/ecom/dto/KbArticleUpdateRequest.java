package com.mursalin.ecom.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class KbArticleUpdateRequest {
    @NotNull(message = "content must not be null")
    private String content;
}
