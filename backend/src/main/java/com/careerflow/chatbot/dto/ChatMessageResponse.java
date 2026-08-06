package com.careerflow.chatbot.dto;

import com.careerflow.chatbot.ChatMessageRole;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ChatMessageResponse {
    private Long id;
    private ChatMessageRole role;
    private String content;
    private LocalDateTime createdAt;
}
