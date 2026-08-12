package com.careerflow.deadline;

import com.careerflow.actionitem.ActionableEntityType;
import com.careerflow.common.SoftDeleteEntity;
import com.careerflow.user.User;
import com.careerflow.workspace.Workspace;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;

@Entity
@Table(name = "deadlines", indexes = {
        @Index(name = "idx_deadlines_user_deleted", columnList = "user_id, deleted_at"),
        @Index(name = "idx_deadlines_workspace", columnList = "workspace_id"),
        @Index(name = "idx_deadlines_status", columnList = "status"),
        @Index(name = "idx_deadlines_due_at", columnList = "due_at"),
        @Index(name = "idx_deadlines_entity", columnList = "entity_type, entity_id")
})
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
@SuperBuilder
public class Deadline extends SoftDeleteEntity {

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
    private DeadlineType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private DeadlineStatus status = DeadlineStatus.UPCOMING;

    @Column(name = "due_at", nullable = false)
    private LocalDateTime dueAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "entity_type", nullable = false)
    private ActionableEntityType entityType;

    @Column(name = "entity_id", nullable = false)
    private Long entityId;

    @Column(columnDefinition = "TEXT")
    private String notes;
}
