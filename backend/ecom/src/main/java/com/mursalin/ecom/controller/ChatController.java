package com.mursalin.ecom.controller;

import com.mursalin.ecom.dto.ApiResponse;
import com.mursalin.ecom.dto.chat.ChatRequest;
import com.mursalin.ecom.dto.chat.ChatResponse;
import com.mursalin.ecom.dto.chat.FeedbackRequest;
import com.mursalin.ecom.dto.chat.FeedbackResponse;
import com.mursalin.ecom.chat.orchestration.ChatOrchestrationService;
import com.mursalin.ecom.chat.tool.ChatAuthResolver;
import com.mursalin.ecom.exception.ResourceNotFoundException;
import com.mursalin.ecom.model.ChatFeedback;
import com.mursalin.ecom.model.ChatMessage;
import com.mursalin.ecom.model.ChatSession;
import com.mursalin.ecom.repository.ChatFeedbackRepository;
import com.mursalin.ecom.repository.ChatMessageRepository;
import com.mursalin.ecom.repository.ChatSessionRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Optional;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatOrchestrationService chatOrchestrationService;
    private final ChatSessionRepository chatSessionRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ChatFeedbackRepository chatFeedbackRepository;

    public ChatController(ChatOrchestrationService chatOrchestrationService,
                          ChatSessionRepository chatSessionRepository,
                          ChatMessageRepository chatMessageRepository,
                          ChatFeedbackRepository chatFeedbackRepository) {
        this.chatOrchestrationService = chatOrchestrationService;
        this.chatSessionRepository = chatSessionRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.chatFeedbackRepository = chatFeedbackRepository;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ChatResponse>> chat(
            @Valid @RequestBody ChatRequest request
    ) {
        ChatResponse response = chatOrchestrationService.handle(request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/messages/{messageId}/feedback")
    public ResponseEntity<ApiResponse<FeedbackResponse>> feedback(
            @PathVariable Long messageId,
            @Valid @RequestBody FeedbackRequest request
    ) {
        ChatSession session = chatSessionRepository.findBySessionToken(request.getSessionToken())
                .filter(s -> s.getExpiresAt().isAfter(LocalDateTime.now()))
                .orElseThrow(() -> new ResourceNotFoundException("Session not found or expired"));

        ChatMessage message = chatMessageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));

        if (!message.getSession().getId().equals(session.getId())) {
            throw new ResourceNotFoundException("Message not found");
        }

        Long jwtUserId = ChatAuthResolver.resolveUserId();
        if (session.getUser() != null && jwtUserId != null && !session.getUser().getUserId().equals(jwtUserId)) {
            throw new ResourceNotFoundException("Message not found");
        }

        Long userIdForDedup = (jwtUserId != null) ? jwtUserId
                : (session.getUser() != null ? session.getUser().getUserId() : null);

        ChatFeedback feedback;
        if (userIdForDedup != null) {
            Optional<ChatFeedback> existing = chatFeedbackRepository.findByMessageIdAndUser_UserId(messageId, userIdForDedup);
            if (existing.isPresent()) {
                feedback = existing.get();
                feedback.setRating(request.getRating());
                feedback = chatFeedbackRepository.save(feedback);
            } else {
                feedback = new ChatFeedback();
                feedback.setMessage(message);
                feedback.setUser(session.getUser());
                feedback.setRating(request.getRating());
                feedback = chatFeedbackRepository.save(feedback);
            }
        } else {
            feedback = new ChatFeedback();
            feedback.setMessage(message);
            feedback.setUser(null);
            feedback.setRating(request.getRating());
            feedback = chatFeedbackRepository.save(feedback);
        }

        FeedbackResponse response = new FeedbackResponse(
                feedback.getId(),
                feedback.getMessage().getId(),
                feedback.getRating(),
                feedback.getCreatedAt(),
                feedback.getUpdatedAt()
        );
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
