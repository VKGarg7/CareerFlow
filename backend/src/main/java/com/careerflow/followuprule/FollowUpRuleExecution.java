package com.careerflow.followuprule;

import com.careerflow.actionitem.ActionableEntityType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "follow_up_rule_executions", uniqueConstraints = {
        @UniqueConstraint(name = "uq_follow_up_rule_execution",
                columnNames = {"rule_id", "trigger_entity_type", "trigger_entity_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FollowUpRuleExecution {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "rule_id", nullable = false)
    private Long ruleId;

    @Enumerated(EnumType.STRING)
    @Column(name = "trigger_entity_type", nullable = false)
    private ActionableEntityType triggerEntityType;

    @Column(name = "trigger_entity_id", nullable = false)
    private Long triggerEntityId;

    @Column(name = "created_action_item_id")
    private Long createdActionItemId;

    @Column(nullable = false, updatable = false)
    private LocalDateTime executedAt;

    @PrePersist
    protected void onCreate() {
        executedAt = LocalDateTime.now();
    }
}
