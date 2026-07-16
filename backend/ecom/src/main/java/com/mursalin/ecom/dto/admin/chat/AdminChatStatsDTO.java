package com.mursalin.ecom.dto.admin.chat;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AdminChatStatsDTO {
    private long totalSessions;
    private long activeSessions;
    private long escalatedSessions;
    private long totalMessages;
    private long helpfulFeedbackCount;
    private long notHelpfulFeedbackCount;
}
