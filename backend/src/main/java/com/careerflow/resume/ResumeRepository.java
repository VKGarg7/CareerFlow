package com.careerflow.resume;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ResumeRepository extends JpaRepository<Resume, Long> {
    Page<Resume> findAllByUserIdAndWorkspaceId(Long userId, Long workspaceId, Pageable pageable);
    Page<Resume> findAllByUserIdAndWorkspaceIdAndTitleContainingIgnoreCase(Long userId, Long workspaceId, String title, Pageable pageable);
    Page<Resume> findAllByUserIdAndWorkspaceIdAndStatus(Long userId, Long workspaceId, ResumeStatus status, Pageable pageable);
    Page<Resume> findAllByUserIdAndWorkspaceIdAndStatusAndTitleContainingIgnoreCase(Long userId, Long workspaceId, ResumeStatus status, String title, Pageable pageable);
    Optional<Resume> findByIdAndUserIdAndWorkspaceId(Long id, Long userId, Long workspaceId);
    boolean existsByDocumentIdAndUserId(Long documentId, Long userId);
}
