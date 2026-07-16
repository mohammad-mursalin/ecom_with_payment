package com.mursalin.ecom.service;

import com.mursalin.ecom.dto.admin.chat.AdminChatMessageDTO;
import com.mursalin.ecom.dto.admin.chat.AdminChatSessionDetailDTO;
import com.mursalin.ecom.dto.admin.chat.AdminChatSessionSummaryDTO;
import com.mursalin.ecom.dto.admin.chat.AdminChatStatsDTO;
import com.mursalin.ecom.dto.admin.chat.FeedbackDTO;
import com.mursalin.ecom.exception.ResourceNotFoundException;
import com.mursalin.ecom.model.ChatFeedback;
import com.mursalin.ecom.model.ChatFeedbackRating;
import com.mursalin.ecom.model.ChatMessage;
import com.mursalin.ecom.model.ChatSession;
import com.mursalin.ecom.repository.ChatFeedbackRepository;
import com.mursalin.ecom.repository.ChatMessageRepository;
import com.mursalin.ecom.repository.ChatSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminChatService {

    private final ChatSessionRepository chatSessionRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ChatFeedbackRepository chatFeedbackRepository;

    public Page<AdminChatSessionSummaryDTO> getSessions(String search, LocalDateTime startDate, LocalDateTime endDate,
                                                         Boolean hasUser, boolean escalatedOnly, Pageable pageable) {
        Page<ChatSession> sessions = chatSessionRepository.findSessions(search, startDate, endDate, hasUser, escalatedOnly, pageable);
        return sessions.map(this::toSummaryDTO);
    }

    public AdminChatSessionDetailDTO getSessionDetail(Long id) {
        ChatSession session = chatSessionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Chat session not found"));

        List<ChatMessage> messages = chatMessageRepository.findBySessionIdOrderByCreatedAtDesc(session.getId(), Pageable.unpaged());
        Map<Long, ChatFeedback> feedbackMap = chatFeedbackRepository.findAllByMessageIdIn(messages.stream()
                .map(ChatMessage::getId)
                .collect(Collectors.toList()))
                .stream()
                .collect(Collectors.toMap(f -> f.getMessage().getId(), f -> f));

        List<AdminChatMessageDTO> messageDTOs = messages.stream()
                .map(msg -> {
                    FeedbackDTO feedbackDTO = null;
                    if (feedbackMap.containsKey(msg.getId())) {
                        ChatFeedback feedback = feedbackMap.get(msg.getId());
                        feedbackDTO = new FeedbackDTO(
                                feedback.getId(),
                                feedback.getRating(),
                                feedback.getCreatedAt(),
                                feedback.getUpdatedAt()
                        );
                    }
                    return new AdminChatMessageDTO(
                            msg.getId(),
                            msg.getRole().name(),
                            msg.getContent(),
                            msg.getIsEscalation(),
                            msg.getCreatedAt(),
                            feedbackDTO
                    );
                })
                .collect(Collectors.toList());

        String username = session.getUser() != null ? session.getUser().getUsername() : null;
        String status = session.getExpiresAt().isAfter(LocalDateTime.now()) ? "active" : "expired";

        return new AdminChatSessionDetailDTO(
                session.getId(),
                username,
                session.getCreatedAt(),
                session.getExpiresAt(),
                status,
                messageDTOs
        );
    }

    public AdminChatStatsDTO getStats() {
        LocalDateTime now = LocalDateTime.now();
        long totalSessions = chatSessionRepository.count();
        long activeSessions = chatSessionRepository.countByExpiresAtAfter(now);
        long escalatedSessions = chatMessageRepository.countDistinctSessionsWithEscalation();
        long totalMessages = chatMessageRepository.count();
        long helpfulFeedbackCount = chatFeedbackRepository.countByRating(ChatFeedbackRating.HELPFUL);
        long notHelpfulFeedbackCount = chatFeedbackRepository.countByRating(ChatFeedbackRating.NOT_HELPFUL);

        return new AdminChatStatsDTO(
                totalSessions,
                activeSessions,
                escalatedSessions,
                totalMessages,
                helpfulFeedbackCount,
                notHelpfulFeedbackCount
        );
    }

    private AdminChatSessionSummaryDTO toSummaryDTO(ChatSession session) {
        LocalDateTime now = LocalDateTime.now();
        String status = session.getExpiresAt().isAfter(now) ? "active" : "expired";
        String username = session.getUser() != null ? session.getUser().getUsername() : null;
        long messageCount = chatMessageRepository.countBySessionId(session.getId());
        boolean isEscalated = chatMessageRepository.existsBySessionIdAndIsEscalationTrue(session.getId());

        return new AdminChatSessionSummaryDTO(
                session.getId(),
                username,
                (int) messageCount,
                isEscalated,
                status,
                session.getCreatedAt(),
                session.getUpdatedAt()
        );
    }
}
