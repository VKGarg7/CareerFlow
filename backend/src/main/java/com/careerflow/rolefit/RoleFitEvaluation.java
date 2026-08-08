package com.careerflow.rolefit;

import com.careerflow.common.SoftDeleteEntity;
import com.careerflow.opportunity.Opportunity;
import com.careerflow.user.User;
import com.careerflow.workspace.Workspace;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.SQLRestriction;

@Entity
@Table(name = "role_fit_evaluations", indexes = {
        @Index(name = "idx_role_fit_user_deleted", columnList = "user_id, deleted_at"),
        @Index(name = "idx_role_fit_workspace", columnList = "workspace_id"),
        @Index(name = "idx_role_fit_opportunity", columnList = "opportunity_id", unique = true)
})
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
@SuperBuilder
public class RoleFitEvaluation extends SoftDeleteEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "workspace_id", nullable = false)
    private Workspace workspace;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "opportunity_id", nullable = false)
    private Opportunity opportunity;


    @Column(columnDefinition = "TEXT")
    private String requiredSkills;

    @Column(columnDefinition = "TEXT")
    private String preferredSkills;

    @Column(columnDefinition = "TEXT")
    private String userSkills;

    private Integer requiredExperienceYears;
    private Double userExperienceYears;

    @Enumerated(EnumType.STRING)
    private FitRating locationFit;

    @Enumerated(EnumType.STRING)
    private FitRating compensationFit;

    @Column(columnDefinition = "TEXT")
    private String riskNotes;

    @Column(columnDefinition = "TEXT")
    private String confidenceNotes;


    private Integer computedFitScore;

    @Column(columnDefinition = "TEXT")
    private String missingSkills;

    @Column(columnDefinition = "TEXT")
    private String scoreBreakdown;


    private Integer overrideFitScore;

    @Enumerated(EnumType.STRING)
    private FitTier overrideFitTier;

    @Column(columnDefinition = "TEXT")
    private String decisionNote;

    public int effectiveFitScore() {
        return overrideFitScore != null ? overrideFitScore : (computedFitScore != null ? computedFitScore : 0);
    }
}
