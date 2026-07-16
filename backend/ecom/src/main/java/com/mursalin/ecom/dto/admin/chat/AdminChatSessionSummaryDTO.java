package com.mursalin.ecom.dto.admin.chat;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class AdminChatSessionSummaryDTO {
    private Long id;
    private String username;
    private int messageCount;
    private boolean isEscalated;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime lastActivityAt;
}
