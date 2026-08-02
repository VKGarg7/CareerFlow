package com.careerflow.document;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {

    /** Finds rows whose {@code storedPath} is still an absolute local filesystem path (pre-S3-migration). */
    List<Document> findByStoredPathStartingWith(String prefix);
}