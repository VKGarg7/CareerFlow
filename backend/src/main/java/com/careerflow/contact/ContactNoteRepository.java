package com.careerflow.contact;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ContactNoteRepository extends JpaRepository<ContactNote, Long> {

    List<ContactNote> findAllByContactIdAndUserId(Long contactId, Long userId, Sort sort);

    Optional<ContactNote> findByIdAndContactIdAndUserId(Long noteId, Long contactId, Long userId);

    int countByContactIdAndUserId(Long contactId, Long userId);

    // Returns [contactId, count] pairs for all contacts belonging to a user — one query for the whole list
    @Query("SELECT n.contact.id, COUNT(n) FROM ContactNote n WHERE n.user.id = :userId GROUP BY n.contact.id")
    List<Object[]> countGroupedByContactForUser(@Param("userId") Long userId);
}
