package com.mursalin.ecom.repository;

import com.mursalin.ecom.model.ChatFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ChatFeedbackRepository extends JpaRepository<ChatFeedback, Long> {

    Optional<ChatFeedback> findByMessageIdAndUser_UserId(Long messageId, Long userId);
}
