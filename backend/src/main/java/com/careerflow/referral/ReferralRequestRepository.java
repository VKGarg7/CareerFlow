package com.careerflow.referral;

import com.careerflow.common.GroupedCountRow;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ReferralRequestRepository extends JpaRepository<ReferralRequest, Long> {

    Page<ReferralRequest> findAllByUserIdAndWorkspaceId(Long userId, Long workspaceId, Pageable pageable);

    Page<ReferralRequest> findAllByUserIdAndWorkspaceIdAndStatus(Long userId, Long workspaceId, ReferralStatus status, Pageable pageable);

    Optional<ReferralRequest> findByIdAndUserIdAndWorkspaceId(Long id, Long userId, Long workspaceId);

    boolean existsByWorkspaceIdAndContactIdAndTargetRoleIgnoreCase(
            Long workspaceId, Long contactId, String targetRole);

    boolean existsByWorkspaceIdAndContactIdAndTargetRoleIgnoreCaseAndIdNot(
            Long workspaceId, Long contactId, String targetRole, Long excludeId);

    @Modifying
    @Query(value = "UPDATE referral_requests SET workspace_id = :workspaceId WHERE user_id = :userId AND workspace_id IS NULL", nativeQuery = true)
    void backfillWorkspaceId(@Param("userId") Long userId, @Param("workspaceId") Long workspaceId);

    @Query("""
            SELECT r FROM ReferralRequest r
            WHERE r.user.id = :userId AND r.workspace.id = :workspaceId
              AND (LOWER(r.contact.name)    LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(r.contact.companyName) LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(r.contact.email)   LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(r.targetRole)      LIKE LOWER(CONCAT('%', :q, '%')))
            """)
    Page<ReferralRequest> searchByUserId(@Param("userId") Long userId, @Param("workspaceId") Long workspaceId, @Param("q") String q, Pageable pageable);

    @Query("""
            SELECT r FROM ReferralRequest r
            WHERE r.user.id = :userId AND r.workspace.id = :workspaceId
              AND r.status = :status
              AND (LOWER(r.contact.name)    LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(r.contact.companyName) LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(r.contact.email)   LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(r.targetRole)      LIKE LOWER(CONCAT('%', :q, '%')))
            """)
    Page<ReferralRequest> searchByUserIdAndStatus(
            @Param("userId") Long userId,
            @Param("workspaceId") Long workspaceId,
            @Param("status") ReferralStatus status,
            @Param("q") String q,
            Pageable pageable);

    long count();

    @Query("SELECT r.status AS status, COUNT(r) AS total FROM ReferralRequest r GROUP BY r.status")
    List<StatusCount> countByStatusGrouped();

    @Query("SELECT r.status AS status, COUNT(r) AS total FROM ReferralRequest r WHERE r.user.id = :userId AND r.workspace.id = :workspaceId GROUP BY r.status")
    List<StatusCount> countByStatusGroupedForUser(@Param("userId") Long userId, @Param("workspaceId") Long workspaceId);

    @Query("SELECT COUNT(r) FROM ReferralRequest r WHERE r.user.id = :userId AND r.workspace.id = :workspaceId " +
            "AND FUNCTION('DATE', r.createdAt) BETWEEN :startDate AND :endDate")
    long countByUserIdAndWorkspaceIdAndCreatedAtBetween(
            @Param("userId") Long userId, @Param("workspaceId") Long workspaceId,
            @Param("startDate") java.time.LocalDate startDate, @Param("endDate") java.time.LocalDate endDate);

        interface StatusCount extends GroupedCountRow<ReferralStatus> {
    }
}
