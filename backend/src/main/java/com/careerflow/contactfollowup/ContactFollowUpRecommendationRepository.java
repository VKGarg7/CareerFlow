package com.careerflow.contactfollowup;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ContactFollowUpRecommendationRepository extends JpaRepository<ContactFollowUpRecommendation, Long> {

    Page<ContactFollowUpRecommendation> findAllByUserIdAndWorkspaceIdAndStatus(
            Long userId, Long workspaceId, RecommendationStatus status, Pageable pageable);

    Page<ContactFollowUpRecommendation> findAllByUserIdAndWorkspaceId(
            Long userId, Long workspaceId, Pageable pageable);

    Optional<ContactFollowUpRecommendation> findByIdAndUserIdAndWorkspaceId(Long id, Long userId, Long workspaceId);

    boolean existsByContactIdAndUserIdAndWorkspaceIdAndStatus(
            @Param("contactId") Long contactId, @Param("userId") Long userId,
            @Param("workspaceId") Long workspaceId, @Param("status") RecommendationStatus status);

    boolean existsByTriggeringOutreachEventIdAndUserIdAndWorkspaceId(
            @Param("triggeringOutreachEventId") Long triggeringOutreachEventId,
            @Param("userId") Long userId, @Param("workspaceId") Long workspaceId);
}
