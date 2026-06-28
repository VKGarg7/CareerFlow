package com.careerflow.user;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserResumeRepository extends JpaRepository<UserResume, Long> {
    Optional<UserResume> findByIdAndUserId(Long id, Long userId);
    boolean existsByUserIdAndDocumentId(Long userId, Long documentId);
}
