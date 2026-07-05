package com.careerflow.interview;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface InterviewRepository extends JpaRepository<Interview, Long> {
    List<Interview> findAllByUserIdAndApplicationIdOrderByScheduledAtAsc(Long userId, Long applicationId);
    Optional<Interview> findByIdAndUserId(Long id, Long userId);
    List<Interview> findAllByUserIdOrderByScheduledAtAsc(Long userId);

    long count();

    @Query("SELECT i.outcome AS outcome, COUNT(i) AS total FROM Interview i GROUP BY i.outcome")
    List<OutcomeCount> countByOutcomeGrouped();

    interface OutcomeCount {
        InterviewOutcome getOutcome();
        long getTotal();
    }
}
