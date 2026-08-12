package com.careerflow.followuprule;

import com.careerflow.actionitem.ActionableEntityType;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FollowUpRuleExecutionRepository extends JpaRepository<FollowUpRuleExecution, Long> {
    boolean existsByRuleIdAndTriggerEntityTypeAndTriggerEntityId(
            Long ruleId, ActionableEntityType triggerEntityType, Long triggerEntityId);
}
