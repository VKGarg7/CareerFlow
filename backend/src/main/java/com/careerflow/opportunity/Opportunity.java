package com.careerflow.opportunity;

import com.careerflow.application.ApplicationSource;
import com.careerflow.company.Company;
import com.careerflow.common.SoftDeleteEntity;
import com.careerflow.coverletter.CoverLetter;
import com.careerflow.resume.Resume;
import com.careerflow.user.User;
import com.careerflow.workspace.Workspace;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.SQLRestriction;

@Entity
@Table(name = "opportunities", indexes = {
        @Index(name = "idx_opportunities_user_deleted", columnList = "user_id, deleted_at"),
        @Index(name = "idx_opportunities_workspace", columnList = "workspace_id"),
        @Index(name = "idx_opportunities_company_id", columnList = "company_id"),
        @Index(name = "idx_opportunities_status", columnList = "status")
})
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
@SuperBuilder
public class Opportunity extends SoftDeleteEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "workspace_id", nullable = false)
    private Workspace workspace;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(nullable = false)
    private String roleTitle;

    private String jobLink;
    private String location;
    private String roleCategory;
    private String salaryInfo;
    private String requisitionId;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Enumerated(EnumType.STRING)
    private ApplicationSource sourceType;

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
    private OpportunityStatus status = OpportunityStatus.SAVED;

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
