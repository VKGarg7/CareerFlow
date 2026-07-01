package com.careerflow.referral;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ReferralRequestRepository extends JpaRepository<ReferralRequest, Long> {

    List<ReferralRequest> findAllByUserId(Long userId, Sort sort);

    List<ReferralRequest> findAllByUserIdAndStatus(Long userId, ReferralStatus status, Sort sort);

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
    List<ReferralRequest> searchByUserId(@Param("userId") Long userId, @Param("q") String q, Sort sort);

    @Query("""
            SELECT r FROM ReferralRequest r
            WHERE r.user.id = :userId
              AND r.status = :status
              AND (LOWER(r.referrerName)    LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(r.referrerCompany) LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(r.referrerEmail)   LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(r.targetRole)      LIKE LOWER(CONCAT('%', :q, '%')))
            """)
    List<ReferralRequest> searchByUserIdAndStatus(
            @Param("userId") Long userId,
            @Param("status") ReferralStatus status,
            @Param("q") String q,
            Sort sort);
}
