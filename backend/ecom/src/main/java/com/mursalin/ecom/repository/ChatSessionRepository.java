package com.mursalin.ecom.repository;

import com.mursalin.ecom.model.ChatSession;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface ChatSessionRepository extends JpaRepository<ChatSession, Long> {

    Optional<ChatSession> findBySessionToken(String token);

    @Query(value = """
            SELECT cs.* FROM chat_sessions cs
            LEFT JOIN users u ON u.user_id = cs.user_id
            WHERE (:search IS NULL OR :search = '' OR LOWER(u.username) LIKE LOWER(CONCAT('%', :search, '%')))
              AND (CAST(:startDate AS timestamp) IS NULL OR cs.created_at >= CAST(:startDate AS timestamp))
              AND (CAST(:endDate AS timestamp) IS NULL OR cs.created_at < CAST(:endDate AS timestamp))
              AND (:hasUser IS NULL OR (cs.user_id IS NULL AND :hasUser = FALSE) OR (cs.user_id IS NOT NULL AND :hasUser = TRUE))
              AND (:escalatedOnly = FALSE OR EXISTS (SELECT 1 FROM chat_messages cm WHERE cm.session_id = cs.id AND cm.is_escalation = true))
            ORDER BY cs.updated_at DESC
            """,
            countQuery = """
            SELECT COUNT(*) FROM chat_sessions cs
            LEFT JOIN users u ON u.user_id = cs.user_id
            WHERE (:search IS NULL OR :search = '' OR LOWER(u.username) LIKE LOWER(CONCAT('%', :search, '%')))
              AND (CAST(:startDate AS timestamp) IS NULL OR cs.created_at >= CAST(:startDate AS timestamp))
              AND (CAST(:endDate AS timestamp) IS NULL OR cs.created_at < CAST(:endDate AS timestamp))
              AND (:hasUser IS NULL OR (cs.user_id IS NULL AND :hasUser = FALSE) OR (cs.user_id IS NOT NULL AND :hasUser = TRUE))
              AND (:escalatedOnly = FALSE OR EXISTS (SELECT 1 FROM chat_messages cm WHERE cm.session_id = cs.id AND cm.is_escalation = true))
            """,
            nativeQuery = true)
    Page<ChatSession> findSessions(@Param("search") String search,
                                    @Param("startDate") LocalDateTime startDate,
                                    @Param("endDate") LocalDateTime endDate,
                                    @Param("hasUser") Boolean hasUser,
                                    @Param("escalatedOnly") boolean escalatedOnly,
                                    Pageable pageable);

    long countByExpiresAtAfter(LocalDateTime now);

    long countByExpiresAtBefore(LocalDateTime now);
}
