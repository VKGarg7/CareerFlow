package com.careerflow.recruiter;

import com.careerflow.common.GroupedCountRow;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RecruiterContactRepository extends JpaRepository<RecruiterContact, Long> {

    Page<RecruiterContact> findAllByUserIdAndWorkspaceId(Long userId, Long workspaceId, Pageable pageable);

    Page<RecruiterContact> findAllByUserIdAndWorkspaceIdAndStatus(Long userId, Long workspaceId, RecruiterStatus status, Pageable pageable);

    @Query("""
            SELECT r FROM RecruiterContact r
            WHERE r.user.id = :userId AND r.workspace.id = :workspaceId
              AND (LOWER(r.name)    LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(r.company) LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(r.email)   LIKE LOWER(CONCAT('%', :q, '%')))
            """)
    Page<RecruiterContact> searchByUserId(@Param("userId") Long userId, @Param("workspaceId") Long workspaceId, @Param("q") String q, Pageable pageable);

    @Query("""
            SELECT r FROM RecruiterContact r
            WHERE r.user.id = :userId AND r.workspace.id = :workspaceId
              AND r.status = :status
              AND (LOWER(r.name)    LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(r.company) LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(r.email)   LIKE LOWER(CONCAT('%', :q, '%')))
            """)
    Page<RecruiterContact> searchByUserIdAndStatus(
            @Param("userId") Long userId,
            @Param("workspaceId") Long workspaceId,
            @Param("status") RecruiterStatus status,
            @Param("q") String q,
            Pageable pageable);

    Optional<RecruiterContact> findByIdAndUserIdAndWorkspaceId(Long id, Long userId, Long workspaceId);

    boolean existsByWorkspaceIdAndEmailIgnoreCase(Long workspaceId, String email);

    boolean existsByWorkspaceIdAndEmailIgnoreCaseAndIdNot(Long workspaceId, String email, Long excludeId);

    @Modifying
    @Query(value = "UPDATE recruiter_contacts SET workspace_id = :workspaceId WHERE user_id = :userId AND workspace_id IS NULL", nativeQuery = true)
    void backfillWorkspaceId(@Param("userId") Long userId, @Param("workspaceId") Long workspaceId);

    @Query("SELECT r.status AS status, COUNT(r) AS total FROM RecruiterContact r WHERE r.user.id = :userId AND r.workspace.id = :workspaceId GROUP BY r.status")
    List<StatusCount> countByStatusGroupedForUser(@Param("userId") Long userId, @Param("workspaceId") Long workspaceId);

    @Query("SELECT DISTINCT r.source FROM RecruiterContact r WHERE r.user.id = :userId AND r.workspace.id = :workspaceId AND r.source IS NOT NULL ORDER BY r.source ASC")
    List<RecruiterSource> findDistinctSourcesForUser(@Param("userId") Long userId, @Param("workspaceId") Long workspaceId);

    interface StatusCount extends GroupedCountRow<RecruiterStatus> {
    }
}
