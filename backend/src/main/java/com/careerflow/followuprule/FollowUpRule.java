package com.careerflow.followuprule;

import com.careerflow.actionitem.ActionType;
import com.careerflow.common.SoftDeleteEntity;
import com.careerflow.user.User;
import com.careerflow.workspace.Workspace;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.SQLRestriction;

@Entity
@Table(name = "follow_up_rules", indexes = {
        @Index(name = "idx_follow_up_rules_user_deleted", columnList = "user_id, deleted_at"),
        @Index(name = "idx_follow_up_rules_workspace_trigger", columnList = "workspace_id, trigger_event")
})
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
@SuperBuilder
public class FollowUpRule extends SoftDeleteEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "workspace_id", nullable = false)
    private Workspace workspace;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "trigger_event", nullable = false)
    private FollowUpTriggerEvent triggerEvent;

    @Column(nullable = false)
    @Builder.Default
    private int delayDays = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "action_type", nullable = false)
    private ActionType actionType;

    @Column(name = "action_title", nullable = false)
    private String actionTitle;

    @Column(nullable = false)
    @Builder.Default
    private boolean enabled = true;
}
