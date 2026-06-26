package com.careerflow.followup;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FollowUpRepository extends JpaRepository<FollowUp, Long> {
    List<FollowUp> findAllByUserIdAndApplicationIdOrderByFollowUpDateAsc(Long userId, Long applicationId);
    List<FollowUp> findAllByUserIdOrderByFollowUpDateAsc(Long userId);
    List<FollowUp> findAllByUserIdAndStatusOrderByFollowUpDateAsc(Long userId, FollowUpStatus status);
    Optional<FollowUp> findByIdAndUserId(Long id, Long userId);
    long countByApplicationIdAndStatus(Long applicationId, FollowUpStatus status);

    @Query("SELECT f.application.id, MIN(f.followUpDate) FROM FollowUp f WHERE f.application.id IN :appIds AND f.status = 'PENDING' GROUP BY f.application.id")
    List<Object[]> findNearestPendingFollowUpDates(@Param("appIds") List<Long> appIds);
}
