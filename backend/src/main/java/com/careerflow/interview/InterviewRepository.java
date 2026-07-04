package com.careerflow.interview;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InterviewRepository extends JpaRepository<Interview, Long> {
    List<Interview> findAllByUserIdAndApplicationIdOrderByScheduledAtAsc(Long userId, Long applicationId);
    Optional<Interview> findByIdAndUserId(Long id, Long userId);
    List<Interview> findAllByUserIdOrderByScheduledAtAsc(Long userId);
}
