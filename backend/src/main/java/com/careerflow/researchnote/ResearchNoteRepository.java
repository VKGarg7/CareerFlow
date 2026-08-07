package com.careerflow.researchnote;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ResearchNoteRepository extends JpaRepository<ResearchNote, Long> {

    List<ResearchNote> findAllByUserIdAndWorkspaceIdAndCompanyIdOrderByCreatedAtAsc(
            Long userId, Long workspaceId, Long companyId);

    Optional<ResearchNote> findByIdAndUserIdAndWorkspaceId(Long id, Long userId, Long workspaceId);

    @Query("""
            SELECT n FROM ResearchNote n JOIN FETCH n.company
            WHERE n.user.id = :userId AND n.workspace.id = :workspaceId
              AND (LOWER(n.title)   LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(n.content) LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(n.company.name) LIKE LOWER(CONCAT('%', :q, '%')))
            """)
    Page<ResearchNote> searchByUserIdAndWorkspaceId(
            @Param("userId") Long userId, @Param("workspaceId") Long workspaceId,
            @Param("q") String q, Pageable pageable);

    int countByUserIdAndWorkspaceIdAndCompanyId(Long userId, Long workspaceId, Long companyId);
}
