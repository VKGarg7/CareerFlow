package com.careerflow.application.dto;

import com.careerflow.application.ApplicationSource;
import com.careerflow.application.ApplicationStatus;
import com.careerflow.document.DocumentDto;
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
    private String jobLink;
    private String location;
    private LocalDate applicationDate;
    private ApplicationSource source;
    private String sourceUrl;
    private String sourceNotes;
    private boolean requiresCoverLetter;
    private boolean requiresAssessment;
    private boolean hasSpecialSteps;
    private ApplicationStatus status;
    private String expectedSalary;
    private LocalDate deadline;
    private String notes;
    private DocumentDto resume;
    private DocumentDto coverLetter;
    private Long resumeLibraryId;
    private String resumeTitle;
    private Long coverLetterLibraryId;
    private String coverLetterTitle;
    private String portfolioLink;
    private String githubLink;
    private String linkedinLink;
    private String questionnaireAnswers;
    private LocalDate nextFollowUpDate;
    private LocalDate nextUpcomingFollowUpDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
