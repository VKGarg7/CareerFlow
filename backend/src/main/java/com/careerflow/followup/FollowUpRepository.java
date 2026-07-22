package com.careerflow.followup;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface FollowUpRepository extends JpaRepository<FollowUp, Long> {
    @Query("SELECT f FROM FollowUp f JOIN FETCH f.application a JOIN FETCH a.company " +
            "WHERE f.user.id = :userId AND f.application.id = :applicationId ORDER BY f.followUpDate ASC")
    List<FollowUp> findAllByUserIdAndApplicationIdOrderByFollowUpDateAsc(@Param("userId") Long userId, @Param("applicationId") Long applicationId);

    @Query(value = "SELECT f FROM FollowUp f JOIN FETCH f.application a JOIN FETCH a.company WHERE f.user.id = :userId",
            countQuery = "SELECT COUNT(f) FROM FollowUp f WHERE f.user.id = :userId")
    Page<FollowUp> findAllByUserIdOrderByFollowUpDateAsc(@Param("userId") Long userId, Pageable pageable);

    @Query(value = "SELECT f FROM FollowUp f JOIN FETCH f.application a JOIN FETCH a.company WHERE f.user.id = :userId AND f.status = :status",
            countQuery = "SELECT COUNT(f) FROM FollowUp f WHERE f.user.id = :userId AND f.status = :status")
    Page<FollowUp> findAllByUserIdAndStatusOrderByFollowUpDateAsc(@Param("userId") Long userId, @Param("status") FollowUpStatus status, Pageable pageable);

    @Query(value = "SELECT f FROM FollowUp f JOIN FETCH f.application a JOIN FETCH a.company WHERE f.user.id = :userId AND a.company.id = :companyId",
            countQuery = "SELECT COUNT(f) FROM FollowUp f WHERE f.user.id = :userId AND f.application.company.id = :companyId")
    Page<FollowUp> findAllByUserIdAndCompanyIdOrderByFollowUpDateAsc(@Param("userId") Long userId, @Param("companyId") Long companyId, Pageable pageable);

    @Query(value = "SELECT f FROM FollowUp f JOIN FETCH f.application a JOIN FETCH a.company WHERE f.user.id = :userId AND a.company.id = :companyId AND f.status = :status",
            countQuery = "SELECT COUNT(f) FROM FollowUp f WHERE f.user.id = :userId AND f.application.company.id = :companyId AND f.status = :status")
    Page<FollowUp> findAllByUserIdAndCompanyIdAndStatusOrderByFollowUpDateAsc(@Param("userId") Long userId, @Param("companyId") Long companyId, @Param("status") FollowUpStatus status, Pageable pageable);

    Optional<FollowUp> findByIdAndUserId(Long id, Long userId);
    long countByApplicationIdAndStatus(Long applicationId, FollowUpStatus status);

    @Query("SELECT f.application.id, MIN(f.followUpDate) FROM FollowUp f WHERE f.application.id IN :appIds AND f.status = 'PENDING' GROUP BY f.application.id")
    List<Object[]> findNearestPendingFollowUpDates(@Param("appIds") List<Long> appIds);

    @Query("SELECT f.application.id, MIN(f.followUpDate) FROM FollowUp f WHERE f.application.id IN :appIds AND f.status = 'PENDING' AND f.followUpDate >= :today GROUP BY f.application.id")
    List<Object[]> findNearestUpcomingFollowUpDates(@Param("appIds") List<Long> appIds, @Param("today") LocalDate today);

    @Query("SELECT f.application.company.id AS companyId, MIN(f.followUpDate) AS nextFollowUp FROM FollowUp f " +
            "WHERE f.user.id = :userId AND f.status = com.careerflow.followup.FollowUpStatus.PENDING AND f.followUpDate >= :today " +
            "GROUP BY f.application.company.id")
    List<CompanyNextFollowUp> nextFollowUpByCompanyGroupedForUser(@Param("userId") Long userId, @Param("today") LocalDate today);

    interface CompanyNextFollowUp {
        Long getCompanyId();
        LocalDate getNextFollowUp();
    }

    long countByUserIdAndStatus(Long userId, FollowUpStatus status);

    long countByUserIdAndStatusAndFollowUpDateBefore(Long userId, FollowUpStatus status, LocalDate date);

    long countByUserIdAndStatusAndFollowUpDate(Long userId, FollowUpStatus status, LocalDate date);

    long countByUserIdAndStatusAndFollowUpDateAfter(Long userId, FollowUpStatus status, LocalDate date);

    @Query(value = "SELECT f FROM FollowUp f JOIN FETCH f.application a JOIN FETCH a.company " +
            "WHERE f.user.id = :userId AND f.status = :status AND f.followUpDate < :today",
            countQuery = "SELECT COUNT(f) FROM FollowUp f WHERE f.user.id = :userId AND f.status = :status AND f.followUpDate < :today")
    Page<FollowUp> findAllByUserIdAndStatusAndFollowUpDateBefore(
            @Param("userId") Long userId, @Param("status") FollowUpStatus status, @Param("today") LocalDate today, Pageable pageable);

    @Query(value = "SELECT f FROM FollowUp f JOIN FETCH f.application a JOIN FETCH a.company " +
            "WHERE f.user.id = :userId AND f.status = :status AND f.followUpDate = :today",
            countQuery = "SELECT COUNT(f) FROM FollowUp f WHERE f.user.id = :userId AND f.status = :status AND f.followUpDate = :today")
    Page<FollowUp> findAllByUserIdAndStatusAndFollowUpDate(
            @Param("userId") Long userId, @Param("status") FollowUpStatus status, @Param("today") LocalDate today, Pageable pageable);

    @Query(value = "SELECT f FROM FollowUp f JOIN FETCH f.application a JOIN FETCH a.company " +
            "WHERE f.user.id = :userId AND f.status = :status AND f.followUpDate > :today",
            countQuery = "SELECT COUNT(f) FROM FollowUp f WHERE f.user.id = :userId AND f.status = :status AND f.followUpDate > :today")
    Page<FollowUp> findAllByUserIdAndStatusAndFollowUpDateAfter(
            @Param("userId") Long userId, @Param("status") FollowUpStatus status, @Param("today") LocalDate today, Pageable pageable);

    @Query("SELECT f FROM FollowUp f JOIN FETCH f.application a JOIN FETCH a.company " +
            "WHERE f.user.id = :userId AND f.status = :status AND f.followUpDate <= :until " +
            "ORDER BY f.followUpDate ASC")
    List<FollowUp> findAllByUserIdAndStatusAndFollowUpDateLessThanEqualOrderByFollowUpDateAsc(
            @Param("userId") Long userId, @Param("status") FollowUpStatus status, @Param("until") LocalDate until);
}
