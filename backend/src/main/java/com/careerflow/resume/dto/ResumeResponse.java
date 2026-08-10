package com.careerflow.resume.dto;

import com.careerflow.resume.ResumeStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ResumeResponse {
    private Long id;
    private String title;
    private String versionTag;
    private String targetRoleCategory;
    private String notes;
    private ResumeStatus status;
    private Long documentId;
    private String originalName;
    private String contentType;
    private Long fileSize;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
