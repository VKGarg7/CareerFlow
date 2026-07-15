package com.careerflow.application;

import com.careerflow.common.GroupedCountRow;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ApplicationRepository extends JpaRepository<JobApplication, Long> {
    @Query(value = "SELECT a FROM JobApplication a JOIN FETCH a.company WHERE a.user.id = :userId",
            countQuery = "SELECT COUNT(a) FROM JobApplication a WHERE a.user.id = :userId")
    Page<JobApplication> findAllByUserId(@Param("userId") Long userId, Pageable pageable);

    @Query(value = "SELECT a FROM JobApplication a JOIN FETCH a.company WHERE a.user.id = :userId AND a.company.id = :companyId",
            countQuery = "SELECT COUNT(a) FROM JobApplication a WHERE a.user.id = :userId AND a.company.id = :companyId")
    Page<JobApplication> findAllByUserIdAndCompanyId(@Param("userId") Long userId, @Param("companyId") Long companyId, Pageable pageable);

    @Query(value = "SELECT a FROM JobApplication a JOIN FETCH a.company WHERE a.user.id = :userId AND a.status = :status",
            countQuery = "SELECT COUNT(a) FROM JobApplication a WHERE a.user.id = :userId AND a.status = :status")
    Page<JobApplication> findAllByUserIdAndStatus(@Param("userId") Long userId, @Param("status") ApplicationStatus status, Pageable pageable);

    @Query(value = "SELECT a FROM JobApplication a JOIN FETCH a.company WHERE a.user.id = :userId AND a.source = :source",
            countQuery = "SELECT COUNT(a) FROM JobApplication a WHERE a.user.id = :userId AND a.source = :source")
    Page<JobApplication> findAllByUserIdAndSource(@Param("userId") Long userId, @Param("source") ApplicationSource source, Pageable pageable);

    @Query(value = "SELECT a FROM JobApplication a JOIN FETCH a.company WHERE a.user.id = :userId AND a.company.id = :companyId AND a.status = :status",
            countQuery = "SELECT COUNT(a) FROM JobApplication a WHERE a.user.id = :userId AND a.company.id = :companyId AND a.status = :status")
    Page<JobApplication> findAllByUserIdAndCompanyIdAndStatus(@Param("userId") Long userId, @Param("companyId") Long companyId, @Param("status") ApplicationStatus status, Pageable pageable);

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

    @Query("SELECT a.status AS status, COUNT(a) AS total FROM JobApplication a WHERE a.user.id = :userId GROUP BY a.status")
    List<StatusCount> countByStatusGroupedForUser(@Param("userId") Long userId);

        interface StatusCount extends GroupedCountRow<ApplicationStatus> {
    }
}
