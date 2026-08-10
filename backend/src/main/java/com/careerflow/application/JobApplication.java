package com.careerflow.application;

import com.careerflow.common.SoftDeleteEntity;
import com.careerflow.company.Company;
import com.careerflow.coverletter.CoverLetter;
import com.careerflow.document.Document;
import com.careerflow.resume.Resume;
import com.careerflow.user.User;
import com.careerflow.workspace.Workspace;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDate;

@Entity
@Table(name = "job_applications", indexes = {
        @Index(name = "idx_job_applications_user_deleted", columnList = "user_id, deleted_at"),
        @Index(name = "idx_job_applications_company_id", columnList = "company_id"),
        @Index(name = "idx_job_applications_status", columnList = "status"),
        @Index(name = "idx_job_applications_workspace", columnList = "workspace_id")
})
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
@SuperBuilder
public class JobApplication extends SoftDeleteEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "workspace_id")
    private Workspace workspace;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(nullable = false)
    private String role;

    private String jobLink;
    private String location;

    @Builder.Default
    private LocalDate applicationDate = LocalDate.now();

    @Enumerated(EnumType.STRING)
    private ApplicationSource source;

    private String sourceUrl;

    @Column(columnDefinition = "TEXT")
    private String sourceNotes;

    @Builder.Default
    private boolean requiresCoverLetter = false;

    @Builder.Default
    private boolean requiresAssessment = false;

    @Builder.Default
    private boolean hasSpecialSteps = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ApplicationStatus status = ApplicationStatus.SAVED;

    private String expectedSalary;

    private LocalDate deadline;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @OneToOne(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "resume_id")
    private Document resume;

    @OneToOne(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "cover_letter_id")
    private Document coverLetter;

    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "resume_library_id")
    private Resume resumeLibrary;

    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "cover_letter_library_id")
    private CoverLetter coverLetterLibrary;

    private String portfolioLink;
    private String githubLink;
    private String linkedinLink;

    @Column(columnDefinition = "TEXT")
    private String questionnaireAnswers;
}
