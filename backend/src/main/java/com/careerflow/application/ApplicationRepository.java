package com.careerflow.application;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ApplicationRepository extends JpaRepository<JobApplication, Long> {
    List<JobApplication> findAllByUserId(Long userId, Sort sort);
    List<JobApplication> findAllByUserIdAndCompanyId(Long userId, Long companyId, Sort sort);
    List<JobApplication> findAllByUserIdAndStatus(Long userId, ApplicationStatus status, Sort sort);
    List<JobApplication> findAllByUserIdAndSource(Long userId, ApplicationSource source, Sort sort);
    List<JobApplication> findAllByUserIdAndCompanyIdAndStatus(Long userId, Long companyId, ApplicationStatus status, Sort sort);
    Optional<JobApplication> findByIdAndUserId(Long id, Long userId);
    Optional<JobApplication> findByResumeIdAndUserId(Long resumeId, Long userId);
    Optional<JobApplication> findByCoverLetterIdAndUserId(Long coverLetterId, Long userId);
    boolean existsByUserIdAndCompanyId(Long userId, Long companyId);

    @Modifying
    @Query("UPDATE JobApplication a SET a.deletedAt = :now WHERE a.company.id = :companyId AND a.deletedAt IS NULL")
    void softDeleteAllByCompanyId(@Param("companyId") Long companyId, @Param("now") LocalDateTime now);

    long count();

    @Query("SELECT a.status AS status, COUNT(a) AS total FROM JobApplication a GROUP BY a.status")
    List<StatusCount> countByStatusGrouped();

    interface StatusCount {
        ApplicationStatus getStatus();
        long getTotal();
    }
}
