package com.careerflow.opportunity.dto;

import com.careerflow.application.ApplicationSource;
import com.careerflow.opportunity.OpportunityStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class OpportunityRequest {

    @NotNull(message = "Company ID is required")
    private Long companyId;

    @NotBlank(message = "Role title is required")
    private String roleTitle;

    private String jobLink;
    private String location;
    private String roleCategory;
    private String salaryInfo;
    private String requisitionId;
    private String notes;
    private OpportunityStatus status;

    private ApplicationSource sourceType;
    private String sourceUrl;
    private String sourceNotes;
    private Boolean requiresCoverLetter;
    private Boolean requiresAssessment;
    private Boolean hasSpecialSteps;
}
