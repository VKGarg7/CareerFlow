package com.careerflow.opportunity.dto;

import com.careerflow.application.ApplicationSource;
import com.careerflow.opportunity.OpportunityStatus;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class OpportunityUpdateRequest {

    private Long companyId;
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
