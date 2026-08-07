package com.careerflow.interview;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface InterviewRepository extends JpaRepository<Interview, Long> {
    @Query("SELECT i FROM Interview i JOIN FETCH i.application a JOIN FETCH a.company " +
            "WHERE i.user.id = :userId AND i.application.id = :applicationId ORDER BY i.scheduledAt ASC")
    List<Interview> findAllByUserIdAndApplicationIdOrderByScheduledAtAsc(@Param("userId") Long userId, @Param("applicationId") Long applicationId);

    Optional<Interview> findByIdAndUserId(Long id, Long userId);

    @Query("SELECT i FROM Interview i JOIN FETCH i.application a JOIN FETCH a.company " +
            "WHERE i.user.id = :userId ORDER BY i.scheduledAt ASC")
    List<Interview> findAllByUserIdOrderByScheduledAtAsc(@Param("userId") Long userId);

    long count();

    @Query("SELECT i.outcome AS outcome, COUNT(i) AS total FROM Interview i GROUP BY i.outcome")
    List<OutcomeCount> countByOutcomeGrouped();

    interface OutcomeCount {
        InterviewOutcome getOutcome();
        long getTotal();
    }

    @Query("SELECT COUNT(i) FROM Interview i WHERE i.user.id = :userId AND i.application.workspace.id = :workspaceId " +
            "AND FUNCTION('DATE', i.scheduledAt) BETWEEN :startDate AND :endDate")
    long countByUserIdAndWorkspaceIdAndScheduledAtBetween(
            @Param("userId") Long userId, @Param("workspaceId") Long workspaceId,
            @Param("startDate") java.time.LocalDate startDate, @Param("endDate") java.time.LocalDate endDate);
}
