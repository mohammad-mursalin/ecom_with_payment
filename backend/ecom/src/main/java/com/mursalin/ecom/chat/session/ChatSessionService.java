package com.mursalin.ecom.chat.session;

import com.mursalin.ecom.chat.tool.ChatAuthResolver;
import com.mursalin.ecom.model.ChatMessage;
import com.mursalin.ecom.model.ChatSession;
import com.mursalin.ecom.model.User;
import com.mursalin.ecom.repository.ChatMessageRepository;
import com.mursalin.ecom.repository.ChatSessionRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class ChatSessionService {

    private static final int CONTEXT_WINDOW_SIZE = 10;

    private final ChatSessionRepository chatSessionRepository;
    private final ChatMessageRepository chatMessageRepository;

    public ChatSessionService(ChatSessionRepository chatSessionRepository,
                              ChatMessageRepository chatMessageRepository) {
        this.chatSessionRepository = chatSessionRepository;
        this.chatMessageRepository = chatMessageRepository;
    }

    @Transactional
    public ChatSession resolveSession(Optional<String> sessionToken) {
        if (sessionToken.isPresent()) {
            Optional<ChatSession> existing = chatSessionRepository.findBySessionToken(sessionToken.get());
            if (existing.isPresent() && existing.get().getExpiresAt().isAfter(LocalDateTime.now())) {
                return existing.get();
            }
        }

        ChatSession newSession = new ChatSession();
        newSession.setSessionToken(UUID.randomUUID().toString());
        newSession.setExpiresAt(LocalDateTime.now().plusHours(24));
        newSession.setUser(null);
        return chatSessionRepository.save(newSession);
    }

    @Transactional
    public ChatSession linkUserIfApplicable(ChatSession session) {
        Long authenticatedUserId = ChatAuthResolver.resolveUserId();
        if (authenticatedUserId == null || session.getUser() != null) {
            return session;
        }

        // SECURITY: chat_sessions.user_id is historical/analytics only.
        // It records who a session was linked to at some point in time.
        // It must never be used as the source of truth for an authorization decision.
        // Every tool that touches user-specific data resolves the current user fresh,
        // from the live SecurityContextHolder on each individual request,
        // never from the stored chat_sessions.user_id.
        User user = new User();
        user.setUserId(authenticatedUserId);
        session.setUser(user);
        session.setUpdatedAt(LocalDateTime.now());
        return chatSessionRepository.save(session);
    }

    @Transactional(readOnly = true)
    public List<ChatMessage> loadContext(Long sessionId) {
        List<ChatMessage> recent = chatMessageRepository.findBySessionIdOrderByCreatedAtDesc(sessionId, Pageable.unpaged());
        recent.sort((a, b) -> a.getCreatedAt().compareTo(b.getCreatedAt()));
        return recent;
    }

    @Transactional
    public void touchSession(Long sessionId) {
        Optional<ChatSession> session = chatSessionRepository.findById(sessionId);
        if (session.isPresent()) {
            ChatSession s = session.get();
            s.setUpdatedAt(LocalDateTime.now());
            chatSessionRepository.save(s);
        }
    }
}
