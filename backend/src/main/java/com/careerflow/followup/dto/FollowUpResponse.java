package com.careerflow.followup.dto;

import com.careerflow.followup.FollowUpStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
public class FollowUpResponse {
    private Long id;
    private Long applicationId;
    private String companyName;
    private String role;
    private LocalDate followUpDate;
    private String note;
    private FollowUpStatus status;
    private boolean overdue;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
