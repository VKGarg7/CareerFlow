package com.careerflow.referral;

import com.careerflow.common.GroupedCountRow;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ReferralRequestRepository extends JpaRepository<ReferralRequest, Long> {

    Page<ReferralRequest> findAllByUserId(Long userId, Pageable pageable);

    Page<ReferralRequest> findAllByUserIdAndStatus(Long userId, ReferralStatus status, Pageable pageable);

    Optional<ReferralRequest> findByIdAndUserId(Long id, Long userId);

    boolean existsByUserIdAndReferrerEmailIgnoreCaseAndTargetRoleIgnoreCase(
            Long userId, String referrerEmail, String targetRole);

    boolean existsByUserIdAndReferrerEmailIgnoreCaseAndTargetRoleIgnoreCaseAndIdNot(
            Long userId, String referrerEmail, String targetRole, Long excludeId);

    @Query("""
            SELECT r FROM ReferralRequest r
            WHERE r.user.id = :userId
              AND (LOWER(r.referrerName)    LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(r.referrerCompany) LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(r.referrerEmail)   LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(r.targetRole)      LIKE LOWER(CONCAT('%', :q, '%')))
            """)
    Page<ReferralRequest> searchByUserId(@Param("userId") Long userId, @Param("q") String q, Pageable pageable);

    @Query("""
            SELECT r FROM ReferralRequest r
            WHERE r.user.id = :userId
              AND r.status = :status
              AND (LOWER(r.referrerName)    LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(r.referrerCompany) LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(r.referrerEmail)   LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(r.targetRole)      LIKE LOWER(CONCAT('%', :q, '%')))
            """)
    Page<ReferralRequest> searchByUserIdAndStatus(
            @Param("userId") Long userId,
            @Param("status") ReferralStatus status,
            @Param("q") String q,
            Pageable pageable);

    long count();

    @Query("SELECT r.status AS status, COUNT(r) AS total FROM ReferralRequest r GROUP BY r.status")
    List<StatusCount> countByStatusGrouped();

    @Query("SELECT r.status AS status, COUNT(r) AS total FROM ReferralRequest r WHERE r.user.id = :userId GROUP BY r.status")
    List<StatusCount> countByStatusGroupedForUser(@Param("userId") Long userId);

        interface StatusCount extends GroupedCountRow<ReferralStatus> {
    }
}
