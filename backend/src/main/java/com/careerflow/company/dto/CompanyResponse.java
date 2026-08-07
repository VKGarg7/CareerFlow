package com.careerflow.company.dto;

import com.careerflow.company.CompanyPriority;
import com.careerflow.company.CompanyStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class CompanyResponse {
    private Long id;
    private String name;
    private String website;
    private String industry;
    private String location;
    private String description;
    private String notes;
    private CompanyStatus status;
    private CompanyPriority priority;
    private String targetReason;
    private String hiringStatus;
    private String recruiterLeads;
    private String referralNotes;
    private String strategyNotes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
