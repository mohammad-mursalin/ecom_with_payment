package com.mursalin.ecom.dto.chat;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatResponse {
    private String sessionToken;
    private String text;
    private StructuredData structuredData;
    private SuggestedAction[] suggestedActions;
}
