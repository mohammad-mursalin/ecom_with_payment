package com.mursalin.ecom.dto.admin.chat;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class AdminChatSessionDetailDTO {
    private Long id;
    private String username;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    private String status;
    private java.util.List<AdminChatMessageDTO> messages;
}
