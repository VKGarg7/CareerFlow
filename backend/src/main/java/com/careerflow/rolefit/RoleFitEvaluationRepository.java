package com.careerflow.rolefit;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RoleFitEvaluationRepository extends JpaRepository<RoleFitEvaluation, Long> {
    Optional<RoleFitEvaluation> findByIdAndUserIdAndWorkspaceId(Long id, Long userId, Long workspaceId);
    Optional<RoleFitEvaluation> findByOpportunityIdAndUserIdAndWorkspaceId(Long opportunityId, Long userId, Long workspaceId);
    boolean existsByOpportunityIdAndUserIdAndWorkspaceId(Long opportunityId, Long userId, Long workspaceId);
}
