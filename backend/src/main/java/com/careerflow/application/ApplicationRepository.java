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
    @Query(value = "SELECT a FROM JobApplication a JOIN FETCH a.company LEFT JOIN FETCH a.resumeLibrary LEFT JOIN FETCH a.coverLetterLibrary WHERE a.user.id = :userId AND a.workspace.id = :workspaceId",
            countQuery = "SELECT COUNT(a) FROM JobApplication a WHERE a.user.id = :userId AND a.workspace.id = :workspaceId")
    Page<JobApplication> findAllByUserIdAndWorkspaceId(@Param("userId") Long userId, @Param("workspaceId") Long workspaceId, Pageable pageable);

    @Query(value = "SELECT a FROM JobApplication a JOIN FETCH a.company LEFT JOIN FETCH a.resumeLibrary LEFT JOIN FETCH a.coverLetterLibrary WHERE a.user.id = :userId AND a.workspace.id = :workspaceId AND a.company.id = :companyId",
            countQuery = "SELECT COUNT(a) FROM JobApplication a WHERE a.user.id = :userId AND a.workspace.id = :workspaceId AND a.company.id = :companyId")
    Page<JobApplication> findAllByUserIdAndWorkspaceIdAndCompanyId(@Param("userId") Long userId, @Param("workspaceId") Long workspaceId, @Param("companyId") Long companyId, Pageable pageable);

    @Query(value = "SELECT a FROM JobApplication a JOIN FETCH a.company LEFT JOIN FETCH a.resumeLibrary LEFT JOIN FETCH a.coverLetterLibrary WHERE a.user.id = :userId AND a.workspace.id = :workspaceId AND a.status = :status",
            countQuery = "SELECT COUNT(a) FROM JobApplication a WHERE a.user.id = :userId AND a.workspace.id = :workspaceId AND a.status = :status")
    Page<JobApplication> findAllByUserIdAndWorkspaceIdAndStatus(@Param("userId") Long userId, @Param("workspaceId") Long workspaceId, @Param("status") ApplicationStatus status, Pageable pageable);

    @Query(value = "SELECT a FROM JobApplication a JOIN FETCH a.company LEFT JOIN FETCH a.resumeLibrary LEFT JOIN FETCH a.coverLetterLibrary WHERE a.user.id = :userId AND a.workspace.id = :workspaceId AND a.source = :source",
            countQuery = "SELECT COUNT(a) FROM JobApplication a WHERE a.user.id = :userId AND a.workspace.id = :workspaceId AND a.source = :source")
    Page<JobApplication> findAllByUserIdAndWorkspaceIdAndSource(@Param("userId") Long userId, @Param("workspaceId") Long workspaceId, @Param("source") ApplicationSource source, Pageable pageable);

    @Query(value = "SELECT a FROM JobApplication a JOIN FETCH a.company LEFT JOIN FETCH a.resumeLibrary LEFT JOIN FETCH a.coverLetterLibrary WHERE a.user.id = :userId AND a.workspace.id = :workspaceId AND a.company.id = :companyId AND a.status = :status",
            countQuery = "SELECT COUNT(a) FROM JobApplication a WHERE a.user.id = :userId AND a.workspace.id = :workspaceId AND a.company.id = :companyId AND a.status = :status")
    Page<JobApplication> findAllByUserIdAndWorkspaceIdAndCompanyIdAndStatus(@Param("userId") Long userId, @Param("workspaceId") Long workspaceId, @Param("companyId") Long companyId, @Param("status") ApplicationStatus status, Pageable pageable);

    Optional<JobApplication> findByIdAndUserIdAndWorkspaceId(Long id, Long userId, Long workspaceId);
    Optional<JobApplication> findByResumeIdAndUserId(Long resumeId, Long userId);
    Optional<JobApplication> findByCoverLetterIdAndUserId(Long coverLetterId, Long userId);
    boolean existsByUserIdAndCompanyIdAndWorkspaceId(Long userId, Long companyId, Long workspaceId);
    boolean existsByResumeLibraryIdAndWorkspaceId(Long resumeLibraryId, Long workspaceId);
    boolean existsByCoverLetterLibraryIdAndWorkspaceId(Long coverLetterLibraryId, Long workspaceId);

    @Modifying
    @Query("UPDATE JobApplication a SET a.deletedAt = :now WHERE a.company.id = :companyId AND a.workspace.id = :workspaceId AND a.deletedAt IS NULL")
    void softDeleteAllByCompanyId(@Param("companyId") Long companyId, @Param("workspaceId") Long workspaceId, @Param("now") LocalDateTime now);

    long count();

    @Modifying
    @Query(value = "UPDATE job_applications SET workspace_id = :workspaceId WHERE user_id = :userId AND workspace_id IS NULL", nativeQuery = true)
    void backfillWorkspaceId(@Param("userId") Long userId, @Param("workspaceId") Long workspaceId);

    @Query("SELECT a.status AS status, COUNT(a) AS total FROM JobApplication a GROUP BY a.status")
    List<StatusCount> countByStatusGrouped();

    @Query("SELECT a.status AS status, COUNT(a) AS total FROM JobApplication a WHERE a.user.id = :userId AND a.workspace.id = :workspaceId GROUP BY a.status")
    List<StatusCount> countByStatusGroupedForUser(@Param("userId") Long userId, @Param("workspaceId") Long workspaceId);

    @Query("SELECT a.company.id AS companyId, COUNT(a) AS total FROM JobApplication a WHERE a.user.id = :userId AND a.workspace.id = :workspaceId GROUP BY a.company.id")
    List<CompanyCount> countByCompanyGroupedForUser(@Param("userId") Long userId, @Param("workspaceId") Long workspaceId);

    @Query("SELECT DISTINCT a.role FROM JobApplication a WHERE a.user.id = :userId AND a.workspace.id = :workspaceId AND a.role IS NOT NULL ORDER BY a.role ASC")
    List<String> findDistinctRolesForUser(@Param("userId") Long userId, @Param("workspaceId") Long workspaceId);

    @Query("SELECT a.company.id AS companyId, MAX(a.applicationDate) AS lastActivity FROM JobApplication a WHERE a.user.id = :userId AND a.workspace.id = :workspaceId GROUP BY a.company.id")
    List<CompanyLastActivity> lastActivityByCompanyGroupedForUser(@Param("userId") Long userId, @Param("workspaceId") Long workspaceId);

    @Query("SELECT EXTRACT(YEAR FROM a.applicationDate) AS year, EXTRACT(MONTH FROM a.applicationDate) AS month, COUNT(a) AS total " +
            "FROM JobApplication a WHERE a.user.id = :userId AND a.workspace.id = :workspaceId AND a.applicationDate >= :since " +
            "GROUP BY EXTRACT(YEAR FROM a.applicationDate), EXTRACT(MONTH FROM a.applicationDate)")
    List<MonthlyCount> countByMonthGroupedForUser(@Param("userId") Long userId, @Param("workspaceId") Long workspaceId, @Param("since") java.time.LocalDate since);

    @Query("SELECT a.applicationDate AS day, COUNT(a) AS total " +
            "FROM JobApplication a WHERE a.user.id = :userId AND a.workspace.id = :workspaceId AND a.applicationDate >= :since " +
            "GROUP BY a.applicationDate")
    List<DailyCount> countByDayGroupedForUser(@Param("userId") Long userId, @Param("workspaceId") Long workspaceId, @Param("since") java.time.LocalDate since);

    @Query(value = "SELECT a FROM JobApplication a JOIN FETCH a.company " +
            "WHERE a.user.id = :userId AND a.workspace.id = :workspaceId AND a.deadline IS NOT NULL AND a.deadline >= :from AND a.deadline <= :until " +
            "ORDER BY a.deadline ASC")
    List<JobApplication> findAllByUserIdAndDeadlineBetweenOrderByDeadlineAsc(
            @Param("userId") Long userId, @Param("workspaceId") Long workspaceId, @Param("from") java.time.LocalDate from, @Param("until") java.time.LocalDate until);

    @Query("SELECT a.source AS source, COUNT(a) AS total, " +
            "SUM(CASE WHEN a.status IN (com.careerflow.application.ApplicationStatus.INTERVIEW_SCHEDULED, com.careerflow.application.ApplicationStatus.INTERVIEW_CLEARED) THEN 1L ELSE 0L END) AS interviews, " +
            "SUM(CASE WHEN a.status = com.careerflow.application.ApplicationStatus.OFFER_RECEIVED THEN 1L ELSE 0L END) AS offers " +
            "FROM JobApplication a WHERE a.user.id = :userId AND a.workspace.id = :workspaceId GROUP BY a.source")
    List<SourceCount> countBySourceGroupedForUser(@Param("userId") Long userId, @Param("workspaceId") Long workspaceId);

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

    @Query("SELECT a.resumeLibrary.id AS resumeId, a.resumeLibrary.title AS resumeTitle, " +
            "a.resumeLibrary.targetRoleCategory AS roleCategory, COUNT(a) AS total, " +
            "SUM(CASE WHEN a.status IN (com.careerflow.application.ApplicationStatus.OA_CLEARED, com.careerflow.application.ApplicationStatus.INTERVIEW_SCHEDULED, com.careerflow.application.ApplicationStatus.INTERVIEW_CLEARED, com.careerflow.application.ApplicationStatus.OFFER_RECEIVED, com.careerflow.application.ApplicationStatus.JOINED) THEN 1L ELSE 0L END) AS oaClears, " +
            "SUM(CASE WHEN a.status IN (com.careerflow.application.ApplicationStatus.INTERVIEW_SCHEDULED, com.careerflow.application.ApplicationStatus.INTERVIEW_CLEARED) THEN 1L ELSE 0L END) AS interviews, " +
            "SUM(CASE WHEN a.status = com.careerflow.application.ApplicationStatus.OFFER_RECEIVED THEN 1L ELSE 0L END) AS offers " +
            "FROM JobApplication a WHERE a.user.id = :userId AND a.workspace.id = :workspaceId AND a.resumeLibrary IS NOT NULL " +
            "AND (:roleCategory IS NULL OR a.resumeLibrary.targetRoleCategory = :roleCategory) " +
            "GROUP BY a.resumeLibrary.id, a.resumeLibrary.title, a.resumeLibrary.targetRoleCategory")
    List<ResumeCount> countByResumeGroupedForUser(@Param("userId") Long userId, @Param("workspaceId") Long workspaceId, @Param("roleCategory") String roleCategory);

    interface ResumeCount {
        Long getResumeId();
        String getResumeTitle();
        String getRoleCategory();
        Long getTotal();
        Long getOaClears();
        Long getInterviews();
        Long getOffers();
    }

    @Query("SELECT COUNT(a) FROM JobApplication a WHERE a.user.id = :userId AND a.workspace.id = :workspaceId " +
            "AND a.applicationDate BETWEEN :startDate AND :endDate")
    long countByUserIdAndWorkspaceIdAndApplicationDateBetween(
            @Param("userId") Long userId, @Param("workspaceId") Long workspaceId,
            @Param("startDate") java.time.LocalDate startDate, @Param("endDate") java.time.LocalDate endDate);

    @Query(value = "SELECT a FROM JobApplication a JOIN FETCH a.company " +
            "WHERE a.user.id = :userId AND a.workspace.id = :workspaceId " +
            "AND a.status NOT IN :excludedStatuses AND a.updatedAt <= :staleBefore " +
            "ORDER BY a.updatedAt ASC")
    List<JobApplication> findStaleCandidates(
            @Param("userId") Long userId, @Param("workspaceId") Long workspaceId,
            @Param("excludedStatuses") List<ApplicationStatus> excludedStatuses,
            @Param("staleBefore") LocalDateTime staleBefore);
}
