package com.careerflow.chatbot;

import com.careerflow.application.JobApplication;
import com.careerflow.common.BaseEntity;
import com.careerflow.user.User;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "chat_sessions", indexes = {
        @Index(name = "idx_chat_sessions_user_updated", columnList = "user_id, updated_at")
})
@Getter
@Setter
@NoArgsConstructor
@SuperBuilder
public class ChatSession extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_id")
    private JobApplication jobApplication;

    private String title;

    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt ASC")
    @Builder.Default
    private List<ChatMessage> messages = new ArrayList<>();
}
