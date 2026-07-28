package com.careerflow.chatbot;

import com.careerflow.common.BaseEntity;
import com.careerflow.user.User;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "chat_messages", indexes = {
        @Index(name = "idx_chat_messages_user_role_created", columnList = "user_id, role, created_at"),
        @Index(name = "idx_chat_messages_session_created", columnList = "session_id, created_at")
})
@Getter
@Setter
@NoArgsConstructor
@SuperBuilder
public class ChatMessage extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_id", nullable = false)
    private ChatSession session;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ChatMessageRole role;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    private Integer promptTokens;

    private Integer completionTokens;
}
