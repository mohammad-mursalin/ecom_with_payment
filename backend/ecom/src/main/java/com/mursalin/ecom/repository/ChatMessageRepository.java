package com.mursalin.ecom.repository;

import com.mursalin.ecom.model.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    List<ChatMessage> findTop10BySessionIdOrderByCreatedAtDesc(Long sessionId);
}
