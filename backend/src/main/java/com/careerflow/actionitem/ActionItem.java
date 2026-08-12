package com.careerflow.actionitem;

import com.careerflow.common.SoftDeleteEntity;
import com.careerflow.user.User;
import com.careerflow.workspace.Workspace;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "action_items", indexes = {
        @Index(name = "idx_action_items_user_deleted", columnList = "user_id, deleted_at"),
        @Index(name = "idx_action_items_workspace", columnList = "workspace_id"),
        @Index(name = "idx_action_items_status", columnList = "status"),
        @Index(name = "idx_action_items_due_date", columnList = "due_date"),
        @Index(name = "idx_action_items_entity", columnList = "entity_type, entity_id")
})
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
@SuperBuilder
public class ActionItem extends SoftDeleteEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "workspace_id", nullable = false)
    private Workspace workspace;

    @Column(nullable = false)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ActionType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ActionStatus status = ActionStatus.OPEN;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ActionPriority priority = ActionPriority.MEDIUM;

    private LocalDate dueDate;

    private LocalDate snoozedUntil;

    @Enumerated(EnumType.STRING)
    @Column(name = "entity_type")
    private ActionableEntityType entityType;

    @Column(name = "entity_id")
    private Long entityId;

    @Column(columnDefinition = "TEXT")
    private String notes;

    private LocalDateTime completedAt;

    private Long sourceRuleId;
}
