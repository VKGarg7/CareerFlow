package com.careerflow.user.dto;

import lombok.Builder;
import lombok.Getter;
import java.time.LocalDateTime;

@Getter @Builder
public class UserResumeDto {
    private Long id;          // UserResume.id — used for deletion
    private Long documentId;  // Document.id — used for download
    private String originalName;
    private String contentType;
    private Long fileSize;
    private LocalDateTime uploadedAt;
}
