package com.careerflow.company;

import com.careerflow.common.GroupedCountRow;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CompanyRepository extends JpaRepository<Company, Long> {
    Page<Company> findAllByUserId(Long userId, Pageable pageable);
    Page<Company> findAllByUserIdAndNameContainingIgnoreCase(Long userId, String name, Pageable pageable);
    Page<Company> findAllByUserIdAndStatus(Long userId, CompanyStatus status, Pageable pageable);
    Page<Company> findAllByUserIdAndStatusAndNameContainingIgnoreCase(Long userId, CompanyStatus status, String name, Pageable pageable);
    Optional<Company> findByIdAndUserId(Long id, Long userId);
    boolean existsByIdAndUserId(Long id, Long userId);
    boolean existsByUserIdAndNameIgnoreCase(Long userId, String name);
    boolean existsByUserIdAndNameIgnoreCaseAndIdNot(Long userId, String name, Long excludeId);

    long count();
    long countByUserId(Long userId);

    @Query("SELECT c.status AS status, COUNT(c) AS total FROM Company c WHERE c.user.id = :userId GROUP BY c.status")
    List<StatusCount> countByStatusGroupedForUser(@Param("userId") Long userId);

    @Query("SELECT FUNCTION('DATE', c.createdAt) AS day, c.status AS status, COUNT(c) AS total " +
            "FROM Company c WHERE c.user.id = :userId AND c.createdAt >= :since " +
            "GROUP BY FUNCTION('DATE', c.createdAt), c.status")
    List<DailyStatusCount> countByDayAndStatusGroupedForUser(@Param("userId") Long userId, @Param("since") java.time.LocalDateTime since);

    @Query("SELECT COUNT(c) FROM Company c WHERE c.user.id = :userId AND c.status = :status AND c.createdAt < :before")
    long countByUserIdAndStatusAndCreatedAtBefore(@Param("userId") Long userId, @Param("status") CompanyStatus status, @Param("before") java.time.LocalDateTime before);

    interface StatusCount extends GroupedCountRow<CompanyStatus> {
    }

    interface DailyStatusCount {
        java.sql.Date getDay();
        CompanyStatus getStatus();
        Long getTotal();
    }
}
