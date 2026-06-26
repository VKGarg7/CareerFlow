package com.careerflow.application.dto;

import com.careerflow.application.ApplicationSource;
import com.careerflow.application.ApplicationStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
public class ApplicationResponse {
    private Long id;
    private Long companyId;
    private String companyName;
    private String role;
    private LocalDate applicationDate;
    private ApplicationSource source;
    private ApplicationStatus status;
    private String expectedSalary;
    private String notes;
    private LocalDate nextFollowUpDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
