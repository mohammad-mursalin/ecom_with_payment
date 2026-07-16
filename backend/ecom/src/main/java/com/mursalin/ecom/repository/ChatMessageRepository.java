package com.mursalin.ecom.repository;

import com.mursalin.ecom.model.ChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    List<ChatMessage> findBySessionIdOrderByCreatedAtDesc(Long sessionId, Pageable pageable);

    Long countBySessionId(Long sessionId);

    @Query("SELECT COUNT(DISTINCT cm.session.id) FROM ChatMessage cm WHERE cm.isEscalation = true")
    long countDistinctSessionsWithEscalation();

    boolean existsBySessionIdAndIsEscalationTrue(Long sessionId);
}
