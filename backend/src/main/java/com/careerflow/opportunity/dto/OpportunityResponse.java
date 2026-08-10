package com.careerflow.opportunity.dto;

import com.careerflow.application.ApplicationSource;
import com.careerflow.opportunity.OpportunityStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class OpportunityResponse {
    private Long id;
    private Long companyId;
    private String companyName;
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
    private boolean requiresCoverLetter;
    private boolean requiresAssessment;
    private boolean hasSpecialSteps;

    private Long resumeLibraryId;
    private String resumeTitle;

    private Long coverLetterLibraryId;
    private String coverLetterTitle;

    private String portfolioLink;
    private String githubLink;
    private String linkedinLink;
    private String questionnaireAnswers;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
