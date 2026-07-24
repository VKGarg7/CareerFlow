package com.careerflow.workspace;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface WorkspaceRepository extends JpaRepository<Workspace, Long> {
    Page<Workspace> findAllByUserId(Long userId, Pageable pageable);
    Page<Workspace> findAllByUserIdAndNameContainingIgnoreCase(Long userId, String name, Pageable pageable);
    Page<Workspace> findAllByUserIdAndStatus(Long userId, WorkspaceStatus status, Pageable pageable);
    Page<Workspace> findAllByUserIdAndStatusAndNameContainingIgnoreCase(Long userId, WorkspaceStatus status, String name, Pageable pageable);
    Optional<Workspace> findByIdAndUserId(Long id, Long userId);
    boolean existsByIdAndUserId(Long id, Long userId);
    boolean existsByUserIdAndNameIgnoreCase(Long userId, String name);
    boolean existsByUserIdAndNameIgnoreCaseAndIdNot(Long userId, String name, Long excludeId);

    long countByUserId(Long userId);

    Optional<Workspace> findByUserIdAndIsDefaultTrue(Long userId);
}
