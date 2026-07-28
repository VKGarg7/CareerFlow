package com.careerflow.chatbot.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ChatSessionResponse {
    private Long id;
    private Long jobApplicationId;
    private String companyName;
    private String applicationRole;
    private String title;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private int messageCount;
}
