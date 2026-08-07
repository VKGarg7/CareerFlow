package com.careerflow.goal;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface GoalRepository extends JpaRepository<Goal, Long> {
    Page<Goal> findAllByUserIdAndWorkspaceId(Long userId, Long workspaceId, Pageable pageable);
    Page<Goal> findAllByUserIdAndWorkspaceIdAndStatus(Long userId, Long workspaceId, GoalStatus status, Pageable pageable);
    Optional<Goal> findByIdAndUserIdAndWorkspaceId(Long id, Long userId, Long workspaceId);
}
