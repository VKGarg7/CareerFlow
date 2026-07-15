package com.careerflow.audit;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    @Query(value = """
            SELECT a FROM AuditLog a
            WHERE (:userId IS NULL OR a.user.id = :userId)
              AND (:action IS NULL OR a.action = :action)
            """,
            countQuery = """
            SELECT COUNT(a) FROM AuditLog a
            WHERE (:userId IS NULL OR a.user.id = :userId)
              AND (:action IS NULL OR a.action = :action)
            """)
    Page<AuditLog> search(@Param("userId") Long userId, @Param("action") AuditAction action, Pageable pageable);
}
