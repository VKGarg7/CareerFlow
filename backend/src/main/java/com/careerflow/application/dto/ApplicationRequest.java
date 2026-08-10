package com.careerflow.application.dto;

import com.careerflow.application.ApplicationSource;
import com.careerflow.application.ApplicationStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class ApplicationRequest {

    @NotNull(message = "Company ID is required")
    private Long companyId;

    @NotBlank(message = "Role is required")
    private String role;

    private String jobLink;
    private String location;

    private LocalDate applicationDate;
    private LocalDate deadline;
    private ApplicationSource source;
    private String sourceUrl;
    private String sourceNotes;
    private Boolean requiresCoverLetter;
    private Boolean requiresAssessment;
    private Boolean hasSpecialSteps;
    private ApplicationStatus status;
    private String expectedSalary;
    private String notes;

    private String portfolioLink;
    private String githubLink;
    private String linkedinLink;
    private String questionnaireAnswers;
}
