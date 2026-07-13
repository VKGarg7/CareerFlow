package com.careerflow.user;

import org.springframework.data.domain.Limit;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    boolean existsByEmail(String email);
    Optional<User> findByEmail(String email);
    boolean existsByRole(Role role);
    long countByActiveTrue();

    List<User> findAllBy(Sort sort, Limit limit);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.resumes WHERE u.email = :email")
    Optional<User> findByEmailWithResumes(@Param("email") String email);

    @Modifying
    @Query(value = "UPDATE users SET role = 'USER' WHERE role IS NULL", nativeQuery = true)
    void backfillNullRoles();

    @Modifying
    @Query(value = "UPDATE users SET active = true WHERE active IS NULL", nativeQuery = true)
    void backfillNullActive();

    @Query("""
            SELECT u FROM User u
            WHERE LOWER(u.firstName) LIKE LOWER(CONCAT('%', :q, '%'))
               OR LOWER(u.lastName)  LIKE LOWER(CONCAT('%', :q, '%'))
               OR LOWER(u.email)     LIKE LOWER(CONCAT('%', :q, '%'))
            """)
    List<User> search(@Param("q") String q, Sort sort, Limit limit);
}
