package com.careerflow.recruiter;

import com.careerflow.common.GroupedCountRow;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RecruiterContactRepository extends JpaRepository<RecruiterContact, Long> {

    Page<RecruiterContact> findAllByUserId(Long userId, Pageable pageable);

    Page<RecruiterContact> findAllByUserIdAndStatus(Long userId, RecruiterStatus status, Pageable pageable);

    @Query("""
            SELECT r FROM RecruiterContact r
            WHERE r.user.id = :userId
              AND (LOWER(r.name)    LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(r.company) LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(r.email)   LIKE LOWER(CONCAT('%', :q, '%')))
            """)
    Page<RecruiterContact> searchByUserId(@Param("userId") Long userId, @Param("q") String q, Pageable pageable);

    @Query("""
            SELECT r FROM RecruiterContact r
            WHERE r.user.id = :userId
              AND r.status = :status
              AND (LOWER(r.name)    LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(r.company) LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(r.email)   LIKE LOWER(CONCAT('%', :q, '%')))
            """)
    Page<RecruiterContact> searchByUserIdAndStatus(
            @Param("userId") Long userId,
            @Param("status") RecruiterStatus status,
            @Param("q") String q,
            Pageable pageable);

    Optional<RecruiterContact> findByIdAndUserId(Long id, Long userId);

    boolean existsByUserIdAndEmailIgnoreCase(Long userId, String email);

    boolean existsByUserIdAndEmailIgnoreCaseAndIdNot(Long userId, String email, Long excludeId);

    @Query("SELECT r.status AS status, COUNT(r) AS total FROM RecruiterContact r WHERE r.user.id = :userId GROUP BY r.status")
    List<StatusCount> countByStatusGroupedForUser(@Param("userId") Long userId);

    @Query("SELECT DISTINCT r.source FROM RecruiterContact r WHERE r.user.id = :userId AND r.source IS NOT NULL ORDER BY r.source ASC")
    List<RecruiterSource> findDistinctSourcesForUser(@Param("userId") Long userId);

    interface StatusCount extends GroupedCountRow<RecruiterStatus> {
    }
}
