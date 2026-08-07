package com.careerflow.opportunity;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface OpportunityRepository extends JpaRepository<Opportunity, Long> {
    Page<Opportunity> findAllByUserIdAndWorkspaceId(Long userId, Long workspaceId, Pageable pageable);
    Page<Opportunity> findAllByUserIdAndWorkspaceIdAndStatus(Long userId, Long workspaceId, OpportunityStatus status, Pageable pageable);
    Page<Opportunity> findAllByUserIdAndWorkspaceIdAndCompanyId(Long userId, Long workspaceId, Long companyId, Pageable pageable);
    Page<Opportunity> findAllByUserIdAndWorkspaceIdAndCompanyIdAndStatus(Long userId, Long workspaceId, Long companyId, OpportunityStatus status, Pageable pageable);
    Optional<Opportunity> findByIdAndUserIdAndWorkspaceId(Long id, Long userId, Long workspaceId);

    List<Opportunity> findAllByUserIdAndWorkspaceIdAndCompanyIdAndRoleTitleIgnoreCaseAndIdNot(
            Long userId, Long workspaceId, Long companyId, String roleTitle, Long excludeId);
    List<Opportunity> findAllByUserIdAndWorkspaceIdAndCompanyIdAndJobLinkIgnoreCaseAndIdNot(
            Long userId, Long workspaceId, Long companyId, String jobLink, Long excludeId);
    List<Opportunity> findAllByUserIdAndWorkspaceIdAndRequisitionIdIgnoreCaseAndIdNot(
            Long userId, Long workspaceId, String requisitionId, Long excludeId);
}
