package com.careerflow.chatbot.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ChatReplyResponse {
    private ChatMessageResponse userMessage;
    private ChatMessageResponse assistantMessage;
}
