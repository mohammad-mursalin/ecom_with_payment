package com.mursalin.ecom.dto.chat;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ChatRequest {

    @NotBlank(message = "message is required")
    @Size(max = 2000, message = "message must be at most 2000 characters")
    private String message;

    private String sessionToken;

    private PageContext pageContext;
}
