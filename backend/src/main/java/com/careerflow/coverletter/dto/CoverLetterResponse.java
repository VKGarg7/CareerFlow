package com.careerflow.coverletter.dto;

import com.careerflow.coverletter.CoverLetterStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class CoverLetterResponse {
    private Long id;
    private String title;
    private String targetRoleCategory;
    private String notes;
    private CoverLetterStatus status;
    private Long documentId;
    private String originalName;
    private String contentType;
    private Long fileSize;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
