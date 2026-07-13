package com.careerflow.followup;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface FollowUpRepository extends JpaRepository<FollowUp, Long> {
    @Query("SELECT f FROM FollowUp f JOIN FETCH f.application a JOIN FETCH a.company " +
            "WHERE f.user.id = :userId AND f.application.id = :applicationId ORDER BY f.followUpDate ASC")
    List<FollowUp> findAllByUserIdAndApplicationIdOrderByFollowUpDateAsc(@Param("userId") Long userId, @Param("applicationId") Long applicationId);

    @Query("SELECT f FROM FollowUp f JOIN FETCH f.application a JOIN FETCH a.company " +
            "WHERE f.user.id = :userId ORDER BY f.followUpDate ASC")
    List<FollowUp> findAllByUserIdOrderByFollowUpDateAsc(@Param("userId") Long userId);

    @Query("SELECT f FROM FollowUp f JOIN FETCH f.application a JOIN FETCH a.company " +
            "WHERE f.user.id = :userId AND f.status = :status ORDER BY f.followUpDate ASC")
    List<FollowUp> findAllByUserIdAndStatusOrderByFollowUpDateAsc(@Param("userId") Long userId, @Param("status") FollowUpStatus status);

    Optional<FollowUp> findByIdAndUserId(Long id, Long userId);
    long countByApplicationIdAndStatus(Long applicationId, FollowUpStatus status);

    @Query("SELECT f.application.id, MIN(f.followUpDate) FROM FollowUp f WHERE f.application.id IN :appIds AND f.status = 'PENDING' GROUP BY f.application.id")
    List<Object[]> findNearestPendingFollowUpDates(@Param("appIds") List<Long> appIds);

    @Query("SELECT f.application.id, MIN(f.followUpDate) FROM FollowUp f WHERE f.application.id IN :appIds AND f.status = 'PENDING' AND f.followUpDate >= :today GROUP BY f.application.id")
    List<Object[]> findNearestUpcomingFollowUpDates(@Param("appIds") List<Long> appIds, @Param("today") LocalDate today);
}
