package com.careerflow.coverletter;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CoverLetterRepository extends JpaRepository<CoverLetter, Long> {
    Page<CoverLetter> findAllByUserIdAndWorkspaceId(Long userId, Long workspaceId, Pageable pageable);
    Page<CoverLetter> findAllByUserIdAndWorkspaceIdAndTitleContainingIgnoreCase(Long userId, Long workspaceId, String title, Pageable pageable);
    Page<CoverLetter> findAllByUserIdAndWorkspaceIdAndStatus(Long userId, Long workspaceId, CoverLetterStatus status, Pageable pageable);
    Page<CoverLetter> findAllByUserIdAndWorkspaceIdAndStatusAndTitleContainingIgnoreCase(Long userId, Long workspaceId, CoverLetterStatus status, String title, Pageable pageable);
    Optional<CoverLetter> findByIdAndUserIdAndWorkspaceId(Long id, Long userId, Long workspaceId);
    boolean existsByDocumentIdAndUserId(Long documentId, Long userId);
}
