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

    @Query("SELECT a.company.id AS companyId, COUNT(a) AS total FROM JobApplication a WHERE a.user.id = :userId GROUP BY a.company.id")
    List<CompanyCount> countByCompanyGroupedForUser(@Param("userId") Long userId);

    @Query("SELECT DISTINCT a.role FROM JobApplication a WHERE a.user.id = :userId AND a.role IS NOT NULL ORDER BY a.role ASC")
    List<String> findDistinctRolesForUser(@Param("userId") Long userId);

    @Query("SELECT a.company.id AS companyId, MAX(a.applicationDate) AS lastActivity FROM JobApplication a WHERE a.user.id = :userId GROUP BY a.company.id")
    List<CompanyLastActivity> lastActivityByCompanyGroupedForUser(@Param("userId") Long userId);

    @Query("SELECT EXTRACT(YEAR FROM a.applicationDate) AS year, EXTRACT(MONTH FROM a.applicationDate) AS month, COUNT(a) AS total " +
            "FROM JobApplication a WHERE a.user.id = :userId AND a.applicationDate >= :since " +
            "GROUP BY EXTRACT(YEAR FROM a.applicationDate), EXTRACT(MONTH FROM a.applicationDate)")
    List<MonthlyCount> countByMonthGroupedForUser(@Param("userId") Long userId, @Param("since") java.time.LocalDate since);

    @Query("SELECT a.applicationDate AS day, COUNT(a) AS total " +
            "FROM JobApplication a WHERE a.user.id = :userId AND a.applicationDate >= :since " +
            "GROUP BY a.applicationDate")
    List<DailyCount> countByDayGroupedForUser(@Param("userId") Long userId, @Param("since") java.time.LocalDate since);

    @Query(value = "SELECT a FROM JobApplication a JOIN FETCH a.company " +
            "WHERE a.user.id = :userId AND a.deadline IS NOT NULL AND a.deadline >= :from AND a.deadline <= :until " +
            "ORDER BY a.deadline ASC")
    List<JobApplication> findAllByUserIdAndDeadlineBetweenOrderByDeadlineAsc(
            @Param("userId") Long userId, @Param("from") java.time.LocalDate from, @Param("until") java.time.LocalDate until);

    @Query("SELECT a.source AS source, COUNT(a) AS total, " +
            "SUM(CASE WHEN a.status IN (com.careerflow.application.ApplicationStatus.INTERVIEW_SCHEDULED, com.careerflow.application.ApplicationStatus.INTERVIEW_CLEARED) THEN 1L ELSE 0L END) AS interviews, " +
            "SUM(CASE WHEN a.status = com.careerflow.application.ApplicationStatus.OFFER_RECEIVED THEN 1L ELSE 0L END) AS offers " +
            "FROM JobApplication a WHERE a.user.id = :userId GROUP BY a.source")
    List<SourceCount> countBySourceGroupedForUser(@Param("userId") Long userId);

    interface StatusCount extends GroupedCountRow<ApplicationStatus> {
    }

    interface CompanyCount {
        Long getCompanyId();
        Long getTotal();
    }

    interface CompanyLastActivity {
        Long getCompanyId();
        java.time.LocalDate getLastActivity();
    }

    interface MonthlyCount {
        Integer getYear();
        Integer getMonth();
        Long getTotal();
    }

    interface DailyCount {
        java.time.LocalDate getDay();
        Long getTotal();
    }

    interface SourceCount {
        ApplicationSource getSource();
        Long getTotal();
        Long getInterviews();
        Long getOffers();
    }

    interface CompanyCount {
        Long getCompanyId();
        Long getTotal();
    }
}
