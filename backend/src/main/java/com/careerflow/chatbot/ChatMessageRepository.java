package com.careerflow.chatbot;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findAllBySessionIdOrderByCreatedAtAsc(Long sessionId);

    long countByUserIdAndRoleAndCreatedAtAfter(Long userId, ChatMessageRole role, LocalDateTime after);

    long countBySessionId(Long sessionId);
}
