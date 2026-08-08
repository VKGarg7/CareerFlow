package com.careerflow.strategy;

import com.careerflow.common.SoftDeleteEntity;
import com.careerflow.opportunity.Opportunity;
import com.careerflow.user.User;
import com.careerflow.workspace.Workspace;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDate;

@Entity
@Table(name = "strategy_items", indexes = {
        @Index(name = "idx_strategy_items_user_deleted", columnList = "user_id, deleted_at"),
        @Index(name = "idx_strategy_items_workspace", columnList = "workspace_id"),
        @Index(name = "idx_strategy_items_opportunity", columnList = "opportunity_id"),
        @Index(name = "idx_strategy_items_status", columnList = "status")
})
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
@SuperBuilder
public class StrategyItem extends SoftDeleteEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "workspace_id", nullable = false)
    private Workspace workspace;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "opportunity_id", nullable = false)
    private Opportunity opportunity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StrategyActionType actionType;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private Integer sortOrder;

    private LocalDate dueDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private StrategyItemStatus status = StrategyItemStatus.PLANNED;

    @Column(columnDefinition = "TEXT")
    private String notes;
}
