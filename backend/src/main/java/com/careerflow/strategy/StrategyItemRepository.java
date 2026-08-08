package com.careerflow.strategy;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StrategyItemRepository extends JpaRepository<StrategyItem, Long> {
    List<StrategyItem> findAllByOpportunityIdAndUserIdAndWorkspaceIdOrderBySortOrderAsc(
            Long opportunityId, Long userId, Long workspaceId);
    Optional<StrategyItem> findByIdAndUserIdAndWorkspaceId(Long id, Long userId, Long workspaceId);

    long countByOpportunityIdAndUserIdAndWorkspaceId(Long opportunityId, Long userId, Long workspaceId);

    @org.springframework.data.jpa.repository.Query(
            "SELECT COALESCE(MAX(s.sortOrder), -1) FROM StrategyItem s " +
            "WHERE s.opportunity.id = :opportunityId AND s.user.id = :userId AND s.workspace.id = :workspaceId")
    int findMaxSortOrder(@org.springframework.data.repository.query.Param("opportunityId") Long opportunityId,
                          @org.springframework.data.repository.query.Param("userId") Long userId,
                          @org.springframework.data.repository.query.Param("workspaceId") Long workspaceId);
}
