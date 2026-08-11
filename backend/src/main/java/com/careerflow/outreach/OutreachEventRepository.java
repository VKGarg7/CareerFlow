package com.careerflow.outreach;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface OutreachEventRepository extends JpaRepository<OutreachEvent, Long> {

    Page<OutreachEvent> findAllByUserIdAndWorkspaceId(Long userId, Long workspaceId, Pageable pageable);

    Optional<OutreachEvent> findByIdAndUserIdAndWorkspaceId(Long id, Long userId, Long workspaceId);

    List<OutreachEvent> findAllByContactIdAndUserIdAndWorkspaceId(Long contactId, Long userId, Long workspaceId, Sort sort);

    List<OutreachEvent> findAllByOpportunityIdAndUserIdAndWorkspaceId(Long opportunityId, Long userId, Long workspaceId, Sort sort);

    List<OutreachEvent> findAllByApplicationIdAndUserIdAndWorkspaceId(Long applicationId, Long userId, Long workspaceId, Sort sort);

    Optional<OutreachEvent> findFirstByContactIdAndUserIdAndWorkspaceIdOrderByEventDateTimeDesc(
            @Param("contactId") Long contactId, @Param("userId") Long userId, @Param("workspaceId") Long workspaceId);

    List<OutreachEvent> findAllByUserIdAndWorkspaceId(Long userId, Long workspaceId, Sort sort);

    List<OutreachEvent> findAllByContactIdAndUserId(Long contactId, Long userId);
}
