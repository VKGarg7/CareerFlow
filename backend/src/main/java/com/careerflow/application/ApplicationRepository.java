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
    @Query("SELECT a FROM JobApplication a JOIN FETCH a.company WHERE a.user.id = :userId")
    List<JobApplication> findAllByUserId(@Param("userId") Long userId, Sort sort);

    @Query("SELECT a FROM JobApplication a JOIN FETCH a.company WHERE a.user.id = :userId AND a.company.id = :companyId")
    List<JobApplication> findAllByUserIdAndCompanyId(@Param("userId") Long userId, @Param("companyId") Long companyId, Sort sort);

    @Query("SELECT a FROM JobApplication a JOIN FETCH a.company WHERE a.user.id = :userId AND a.status = :status")
    List<JobApplication> findAllByUserIdAndStatus(@Param("userId") Long userId, @Param("status") ApplicationStatus status, Sort sort);

    @Query("SELECT a FROM JobApplication a JOIN FETCH a.company WHERE a.user.id = :userId AND a.source = :source")
    List<JobApplication> findAllByUserIdAndSource(@Param("userId") Long userId, @Param("source") ApplicationSource source, Sort sort);

    @Query("SELECT a FROM JobApplication a JOIN FETCH a.company WHERE a.user.id = :userId AND a.company.id = :companyId AND a.status = :status")
    List<JobApplication> findAllByUserIdAndCompanyIdAndStatus(@Param("userId") Long userId, @Param("companyId") Long companyId, @Param("status") ApplicationStatus status, Sort sort);

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
