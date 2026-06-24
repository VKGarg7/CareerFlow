package com.careerflow.application;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ApplicationRepository extends JpaRepository<JobApplication, Long> {
    List<JobApplication> findAllByUserId(Long userId, Sort sort);
    List<JobApplication> findAllByUserIdAndCompanyId(Long userId, Long companyId, Sort sort);
    List<JobApplication> findAllByUserIdAndStatus(Long userId, ApplicationStatus status, Sort sort);
    List<JobApplication> findAllByUserIdAndSource(Long userId, ApplicationSource source, Sort sort);
    List<JobApplication> findAllByUserIdAndCompanyIdAndStatus(Long userId, Long companyId, ApplicationStatus status, Sort sort);
    Optional<JobApplication> findByIdAndUserId(Long id, Long userId);
    boolean existsByUserIdAndCompanyId(Long userId, Long companyId);
    void deleteAllByCompanyId(Long companyId);
}
