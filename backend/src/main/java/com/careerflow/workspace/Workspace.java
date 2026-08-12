package com.careerflow.workspace;

import com.careerflow.common.SoftDeleteEntity;
import com.careerflow.user.User;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.SQLRestriction;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "workspaces", indexes = {
        @Index(name = "idx_workspaces_user_deleted", columnList = "user_id, deleted_at"),
        @Index(name = "idx_workspaces_status", columnList = "status")
})
@SQLRestriction("deleted_at IS NULL")
@Getter @Setter @NoArgsConstructor @SuperBuilder
public class Workspace extends SoftDeleteEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private List<String> targetRoles;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private List<String> preferredLocations;

    private Long compensationMin;
    private Long compensationMax;

    @Enumerated(EnumType.STRING)
    private WorkMode workMode;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private List<JobType> jobTypes;

    private LocalDate searchStartDate;

    private Integer goalApplicationsTarget;
    private Integer goalInterviewsTarget;
    private Integer goalOffersTarget;

    @Column(nullable = false)
    @Builder.Default
    private Integer staleApplicationThresholdDays = 14;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private WorkspaceStatus status = WorkspaceStatus.ACTIVE;

    @Column(nullable = false, columnDefinition = "boolean not null default false")
    @Builder.Default
    private Boolean isDefault = false;
}
