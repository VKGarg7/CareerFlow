package com.careerflow.workspace.dto;

import com.careerflow.workspace.JobType;
import com.careerflow.workspace.WorkMode;
import com.careerflow.workspace.WorkspaceStatus;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
public class WorkspaceUpdateRequest {

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
}
