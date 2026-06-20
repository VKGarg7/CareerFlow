package com.careerflow.document;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class DocumentDto {
    private Long id;
    private String originalName;
    private String contentType;
    private Long fileSize;
    private LocalDateTime uploadedAt;
}