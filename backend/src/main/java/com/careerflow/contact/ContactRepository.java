package com.careerflow.contact;

import com.careerflow.common.GroupedCountRow;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ContactRepository extends JpaRepository<Contact, Long> {

    Page<Contact> findAllByUserIdAndWorkspaceId(Long userId, Long workspaceId, Pageable pageable);

    Page<Contact> findAllByUserIdAndWorkspaceIdAndStatus(Long userId, Long workspaceId, ContactStatus status, Pageable pageable);

    Page<Contact> findAllByUserIdAndWorkspaceIdAndRelationshipType(Long userId, Long workspaceId, ContactRelationshipType relationshipType, Pageable pageable);

    Page<Contact> findAllByUserIdAndWorkspaceIdAndStatusAndRelationshipType(Long userId, Long workspaceId, ContactStatus status, ContactRelationshipType relationshipType, Pageable pageable);

    @Query("""
            SELECT c FROM Contact c
            WHERE c.user.id = :userId AND c.workspace.id = :workspaceId
              AND (LOWER(c.name)        LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(c.companyName) LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(c.email)       LIKE LOWER(CONCAT('%', :q, '%')))
            """)
    Page<Contact> searchByUserId(@Param("userId") Long userId, @Param("workspaceId") Long workspaceId, @Param("q") String q, Pageable pageable);

    @Query("""
            SELECT c FROM Contact c
            WHERE c.user.id = :userId AND c.workspace.id = :workspaceId
              AND c.status = :status
              AND (LOWER(c.name)        LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(c.companyName) LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(c.email)       LIKE LOWER(CONCAT('%', :q, '%')))
            """)
    Page<Contact> searchByUserIdAndStatus(
            @Param("userId") Long userId,
            @Param("workspaceId") Long workspaceId,
            @Param("status") ContactStatus status,
            @Param("q") String q,
            Pageable pageable);

    @Query("""
            SELECT c FROM Contact c
            WHERE c.user.id = :userId AND c.workspace.id = :workspaceId
              AND c.relationshipType = :relationshipType
              AND (LOWER(c.name)        LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(c.companyName) LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(c.email)       LIKE LOWER(CONCAT('%', :q, '%')))
            """)
    Page<Contact> searchByUserIdAndRelationshipType(
            @Param("userId") Long userId,
            @Param("workspaceId") Long workspaceId,
            @Param("relationshipType") ContactRelationshipType relationshipType,
            @Param("q") String q,
            Pageable pageable);

    @Query("""
            SELECT c FROM Contact c
            WHERE c.user.id = :userId AND c.workspace.id = :workspaceId
              AND c.status = :status AND c.relationshipType = :relationshipType
              AND (LOWER(c.name)        LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(c.companyName) LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(c.email)       LIKE LOWER(CONCAT('%', :q, '%')))
            """)
    Page<Contact> searchByUserIdAndStatusAndRelationshipType(
            @Param("userId") Long userId,
            @Param("workspaceId") Long workspaceId,
            @Param("status") ContactStatus status,
            @Param("relationshipType") ContactRelationshipType relationshipType,
            @Param("q") String q,
            Pageable pageable);

    Optional<Contact> findByIdAndUserIdAndWorkspaceId(Long id, Long userId, Long workspaceId);

    boolean existsByWorkspaceIdAndEmailIgnoreCase(Long workspaceId, String email);

    boolean existsByWorkspaceIdAndEmailIgnoreCaseAndIdNot(Long workspaceId, String email, Long excludeId);

    @Modifying
    @Query(value = "UPDATE contacts SET workspace_id = :workspaceId WHERE user_id = :userId AND workspace_id IS NULL", nativeQuery = true)
    void backfillWorkspaceId(@Param("userId") Long userId, @Param("workspaceId") Long workspaceId);

    @Query("SELECT c.status AS status, COUNT(c) AS total FROM Contact c WHERE c.user.id = :userId AND c.workspace.id = :workspaceId GROUP BY c.status")
    List<StatusCount> countByStatusGroupedForUser(@Param("userId") Long userId, @Param("workspaceId") Long workspaceId);

    @Query("SELECT c.relationshipType AS status, COUNT(c) AS total FROM Contact c WHERE c.user.id = :userId AND c.workspace.id = :workspaceId AND c.relationshipType IS NOT NULL GROUP BY c.relationshipType")
    List<RelationshipTypeCount> countByRelationshipTypeGroupedForUser(@Param("userId") Long userId, @Param("workspaceId") Long workspaceId);

    @Query("SELECT DISTINCT c.source FROM Contact c WHERE c.user.id = :userId AND c.workspace.id = :workspaceId AND c.source IS NOT NULL ORDER BY c.source ASC")
    List<ContactSource> findDistinctSourcesForUser(@Param("userId") Long userId, @Param("workspaceId") Long workspaceId);

    @Query("SELECT COUNT(c) FROM Contact c WHERE c.user.id = :userId AND c.workspace.id = :workspaceId " +
            "AND FUNCTION('DATE', c.createdAt) BETWEEN :startDate AND :endDate")
    long countByUserIdAndWorkspaceIdAndCreatedAtBetween(
            @Param("userId") Long userId, @Param("workspaceId") Long workspaceId,
            @Param("startDate") java.time.LocalDate startDate, @Param("endDate") java.time.LocalDate endDate);

    interface StatusCount extends GroupedCountRow<ContactStatus> {
    }

    interface RelationshipTypeCount extends GroupedCountRow<ContactRelationshipType> {
    }
}
