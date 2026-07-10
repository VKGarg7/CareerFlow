package com.careerflow.workspace.dto;

import com.careerflow.workspace.JobType;
import com.careerflow.workspace.WorkMode;
import com.careerflow.workspace.WorkspaceStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class WorkspaceResponse {
    private Long id;
    private String name;
    private String description;
    private List<String> targetRoles;
    private List<String> preferredLocations;
    private Long compensationMin;
    private Long compensationMax;
    private WorkMode workMode;
    private List<JobType> jobTypes;
    private LocalDate searchStartDate;
    private Integer goalApplicationsTarget;
    private Integer goalInterviewsTarget;
    private Integer goalOffersTarget;
    private WorkspaceStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
