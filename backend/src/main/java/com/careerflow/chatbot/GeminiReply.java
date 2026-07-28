package com.careerflow.chatbot;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class GeminiReply {
    private String text;
    private Integer inputTokens;
    private Integer outputTokens;
}
