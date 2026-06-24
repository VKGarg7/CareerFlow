package com.careerflow.recruiter;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RecruiterContactRepository extends JpaRepository<RecruiterContact, Long> {

    List<RecruiterContact> findAllByUserId(Long userId, Sort sort);

    List<RecruiterContact> findAllByUserIdAndStatus(Long userId, RecruiterStatus status, Sort sort);

    @Query("""
            SELECT r FROM RecruiterContact r
            WHERE r.user.id = :userId
              AND (LOWER(r.name)    LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(r.company) LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(r.email)   LIKE LOWER(CONCAT('%', :q, '%')))
            """)
    List<RecruiterContact> searchByUserId(@Param("userId") Long userId, @Param("q") String q, Sort sort);

    @Query("""
            SELECT r FROM RecruiterContact r
            WHERE r.user.id = :userId
              AND r.status = :status
              AND (LOWER(r.name)    LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(r.company) LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(r.email)   LIKE LOWER(CONCAT('%', :q, '%')))
            """)
    List<RecruiterContact> searchByUserIdAndStatus(
            @Param("userId") Long userId,
            @Param("status") RecruiterStatus status,
            @Param("q") String q,
            Sort sort);

    Optional<RecruiterContact> findByIdAndUserId(Long id, Long userId);

    boolean existsByUserIdAndEmailIgnoreCase(Long userId, String email);

    boolean existsByUserIdAndEmailIgnoreCaseAndIdNot(Long userId, String email, Long excludeId);
}
