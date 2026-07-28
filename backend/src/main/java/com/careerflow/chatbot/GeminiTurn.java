package com.careerflow.chatbot;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class GeminiTurn {
    private String role;
    private String content;
}
