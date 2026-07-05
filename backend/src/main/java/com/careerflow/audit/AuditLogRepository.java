package com.careerflow.audit;

import org.springframework.data.domain.Limit;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    @Query("""
            SELECT a FROM AuditLog a
            WHERE (:userId IS NULL OR a.user.id = :userId)
              AND (:action IS NULL OR a.action = :action)
            """)
    List<AuditLog> search(@Param("userId") Long userId, @Param("action") AuditAction action, Sort sort, Limit limit);
}
