package com.careerflow.deadline;

import com.careerflow.actionitem.ActionableEntityType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface DeadlineRepository extends JpaRepository<Deadline, Long> {
    Page<Deadline> findAllByUserIdAndWorkspaceId(Long userId, Long workspaceId, Pageable pageable);
    Page<Deadline> findAllByUserIdAndWorkspaceIdAndStatus(Long userId, Long workspaceId, DeadlineStatus status, Pageable pageable);
    Optional<Deadline> findByIdAndUserIdAndWorkspaceId(Long id, Long userId, Long workspaceId);

    List<Deadline> findAllByUserIdAndWorkspaceIdAndEntityTypeAndEntityId(
            Long userId, Long workspaceId, ActionableEntityType entityType, Long entityId);

    List<Deadline> findAllByUserIdAndWorkspaceIdAndStatusAndDueAtBetweenOrderByDueAtAsc(
            Long userId, Long workspaceId, DeadlineStatus status, LocalDateTime from, LocalDateTime until);
}
