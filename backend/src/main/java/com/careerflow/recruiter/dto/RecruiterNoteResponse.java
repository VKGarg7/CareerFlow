package com.careerflow.recruiter.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class RecruiterNoteResponse {
    private Long id;
    private Long recruiterId;
    private String content;
    private boolean edited;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
