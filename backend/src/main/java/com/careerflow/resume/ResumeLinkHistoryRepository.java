package com.careerflow.resume;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ResumeLinkHistoryRepository extends JpaRepository<ResumeLinkHistory, Long> {
    List<ResumeLinkHistory> findAllByEntityTypeAndEntityIdOrderByCreatedAtDesc(LinkedEntityType entityType, Long entityId);
}
