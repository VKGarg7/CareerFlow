package com.careerflow.actionitem;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface ActionItemRepository extends JpaRepository<ActionItem, Long> {
    Page<ActionItem> findAllByUserIdAndWorkspaceId(Long userId, Long workspaceId, Pageable pageable);
    Page<ActionItem> findAllByUserIdAndWorkspaceIdAndStatus(Long userId, Long workspaceId, ActionStatus status, Pageable pageable);
    Page<ActionItem> findAllByUserIdAndWorkspaceIdAndType(Long userId, Long workspaceId, ActionType type, Pageable pageable);
    Page<ActionItem> findAllByUserIdAndWorkspaceIdAndStatusAndType(Long userId, Long workspaceId, ActionStatus status, ActionType type, Pageable pageable);
    Optional<ActionItem> findByIdAndUserIdAndWorkspaceId(Long id, Long userId, Long workspaceId);

    List<ActionItem> findAllByUserIdAndWorkspaceIdAndEntityTypeAndEntityId(
            Long userId, Long workspaceId, ActionableEntityType entityType, Long entityId);

    List<ActionItem> findAllByUserIdAndWorkspaceIdAndStatusAndDueDateLessThanEqual(
            Long userId, Long workspaceId, ActionStatus status, LocalDate dueDate);

    List<ActionItem> findAllByUserIdAndWorkspaceIdAndStatusAndSnoozedUntilLessThanEqual(
            Long userId, Long workspaceId, ActionStatus status, LocalDate snoozedUntil);
}
