package com.careerflow.timeline;

import com.careerflow.actionitem.ActionableEntityType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TimelineEventRepository extends JpaRepository<TimelineEvent, Long> {
    Page<TimelineEvent> findAllByUserIdAndWorkspaceIdAndEntityTypeAndEntityIdOrderByOccurredAtDesc(
            Long userId, Long workspaceId, ActionableEntityType entityType, Long entityId, Pageable pageable);

    Page<TimelineEvent> findAllByUserIdAndWorkspaceIdOrderByOccurredAtDesc(
            Long userId, Long workspaceId, Pageable pageable);
}
