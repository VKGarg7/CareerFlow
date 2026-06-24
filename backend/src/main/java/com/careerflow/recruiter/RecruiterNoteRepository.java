package com.careerflow.recruiter;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RecruiterNoteRepository extends JpaRepository<RecruiterNote, Long> {

    List<RecruiterNote> findAllByRecruiterContactIdAndUserId(Long recruiterId, Long userId, Sort sort);

    Optional<RecruiterNote> findByIdAndRecruiterContactIdAndUserId(Long noteId, Long recruiterId, Long userId);

    int countByRecruiterContactIdAndUserId(Long recruiterId, Long userId);

    // Returns [recruiterId, count] pairs for all recruiters belonging to a user — one query for the whole list
    @Query("SELECT n.recruiterContact.id, COUNT(n) FROM RecruiterNote n WHERE n.user.id = :userId GROUP BY n.recruiterContact.id")
    List<Object[]> countGroupedByRecruiterForUser(@Param("userId") Long userId);
}
