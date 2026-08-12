package com.careerflow.followuprule;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FollowUpRuleRepository extends JpaRepository<FollowUpRule, Long> {
    Page<FollowUpRule> findAllByUserIdAndWorkspaceId(Long userId, Long workspaceId, Pageable pageable);
    Optional<FollowUpRule> findByIdAndUserIdAndWorkspaceId(Long id, Long userId, Long workspaceId);
    List<FollowUpRule> findAllByWorkspaceIdAndTriggerEventAndEnabledTrue(Long workspaceId, FollowUpTriggerEvent triggerEvent);
}
