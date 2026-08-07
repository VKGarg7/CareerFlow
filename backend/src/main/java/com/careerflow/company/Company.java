package com.careerflow.company;

import com.careerflow.common.SoftDeleteEntity;
import com.careerflow.user.User;
import com.careerflow.workspace.Workspace;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.SQLRestriction;

@Entity
@Table(name = "companies", indexes = {
        @Index(name = "idx_companies_user_deleted", columnList = "user_id, deleted_at"),
        @Index(name = "idx_companies_status", columnList = "status"),
        @Index(name = "idx_companies_workspace", columnList = "workspace_id")
})
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
@SuperBuilder
public class Company extends SoftDeleteEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // Nullable for now: backfilled by WorkspaceBackfillRunner on boot, then
    // tightened to nullable = false once every existing row is confirmed backfilled.
    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "workspace_id")
    private Workspace workspace;

    @Column(nullable = false)
    private String name;

    private String website;
    private String industry;
    private String location;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private CompanyStatus status = CompanyStatus.TARGETING;

    @Enumerated(EnumType.STRING)
    private CompanyPriority priority;

    @Column(columnDefinition = "TEXT")
    private String targetReason;

    private String hiringStatus;

    @Column(columnDefinition = "TEXT")
    private String recruiterLeads;

    @Column(columnDefinition = "TEXT")
    private String referralNotes;

    @Column(columnDefinition = "TEXT")
    private String strategyNotes;
}
