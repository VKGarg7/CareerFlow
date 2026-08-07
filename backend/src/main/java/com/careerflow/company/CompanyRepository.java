package com.careerflow.company;

import com.careerflow.common.GroupedCountRow;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CompanyRepository extends JpaRepository<Company, Long> {
    Page<Company> findAllByUserIdAndWorkspaceId(Long userId, Long workspaceId, Pageable pageable);
    Page<Company> findAllByUserIdAndWorkspaceIdAndNameContainingIgnoreCase(Long userId, Long workspaceId, String name, Pageable pageable);
    Page<Company> findAllByUserIdAndWorkspaceIdAndStatus(Long userId, Long workspaceId, CompanyStatus status, Pageable pageable);
    Page<Company> findAllByUserIdAndWorkspaceIdAndStatusAndNameContainingIgnoreCase(Long userId, Long workspaceId, CompanyStatus status, String name, Pageable pageable);
    Optional<Company> findByIdAndUserIdAndWorkspaceId(Long id, Long userId, Long workspaceId);
    boolean existsByIdAndUserIdAndWorkspaceId(Long id, Long userId, Long workspaceId);
    boolean existsByWorkspaceIdAndNameIgnoreCase(Long workspaceId, String name);
    boolean existsByWorkspaceIdAndNameIgnoreCaseAndIdNot(Long workspaceId, String name, Long excludeId);

    long count();
    long countByUserIdAndWorkspaceId(Long userId, Long workspaceId);

    @Modifying
    @Query(value = "UPDATE companies SET workspace_id = :workspaceId WHERE user_id = :userId AND workspace_id IS NULL", nativeQuery = true)
    void backfillWorkspaceId(@Param("userId") Long userId, @Param("workspaceId") Long workspaceId);

    @Query("SELECT c.status AS status, COUNT(c) AS total FROM Company c WHERE c.user.id = :userId AND c.workspace.id = :workspaceId GROUP BY c.status")
    List<StatusCount> countByStatusGroupedForUser(@Param("userId") Long userId, @Param("workspaceId") Long workspaceId);

    @Query("SELECT FUNCTION('DATE', c.createdAt) AS day, c.status AS status, COUNT(c) AS total " +
            "FROM Company c WHERE c.user.id = :userId AND c.workspace.id = :workspaceId AND c.createdAt >= :since " +
            "GROUP BY FUNCTION('DATE', c.createdAt), c.status")
    List<DailyStatusCount> countByDayAndStatusGroupedForUser(@Param("userId") Long userId, @Param("workspaceId") Long workspaceId, @Param("since") java.time.LocalDateTime since);

    @Query("SELECT COUNT(c) FROM Company c WHERE c.user.id = :userId AND c.workspace.id = :workspaceId AND c.status = :status AND c.createdAt < :before")
    long countByUserIdAndStatusAndCreatedAtBefore(@Param("userId") Long userId, @Param("workspaceId") Long workspaceId, @Param("status") CompanyStatus status, @Param("before") java.time.LocalDateTime before);

    @Query("SELECT COUNT(c) FROM Company c WHERE c.user.id = :userId AND c.workspace.id = :workspaceId " +
            "AND FUNCTION('DATE', c.createdAt) BETWEEN :startDate AND :endDate")
    long countByUserIdAndWorkspaceIdAndCreatedAtBetween(
            @Param("userId") Long userId, @Param("workspaceId") Long workspaceId,
            @Param("startDate") java.time.LocalDate startDate, @Param("endDate") java.time.LocalDate endDate);

    interface StatusCount extends GroupedCountRow<CompanyStatus> {
    }

    interface DailyStatusCount {
        java.sql.Date getDay();
        CompanyStatus getStatus();
        Long getTotal();
    }
}
