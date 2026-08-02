package com.careerflow.config;

import com.careerflow.document.Document;
import com.careerflow.document.DocumentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * One-off backfill for documents uploaded before the switch to S3: their {@code storedPath}
 * is still an absolute local filesystem path. Off by default since most environments have no
 * such rows; enable with {@code app.migrate-local-files-to-s3=true} to run it once.
 * Idempotent — migrated rows get a relative S3 key and won't match on a re-run.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class LocalFileToS3MigrationRunner implements CommandLineRunner {

    private final DocumentRepository documentRepository;
    private final S3Client s3Client;

    @Value("${aws.s3.bucket}")
    private String bucket;

    @Value("${app.migrate-local-files-to-s3:false}")
    private boolean enabled;

    @Override
    public void run(String... args) {
        if (!enabled) return;

        for (Document doc : documentRepository.findByStoredPathStartingWith("/")) {
            try {
                migrate(doc);
            } catch (Exception e) {
                log.warn("Failed to migrate document {} ({}) to S3: {}", doc.getId(), doc.getStoredPath(), e.getMessage());
            }
        }
    }

    private void migrate(Document doc) {
        Path localPath = Paths.get(doc.getStoredPath());
        String filename = localPath.getFileName().toString();
        String subfolder = localPath.getParent() != null
                ? localPath.getParent().getFileName().toString()
                : "migrated";
        String key = subfolder + "/" + filename;

        s3Client.putObject(
                PutObjectRequest.builder().bucket(bucket).key(key).contentType(doc.getContentType()).build(),
                RequestBody.fromFile(localPath));

        doc.setStoredPath(key);
        documentRepository.save(doc);
        log.info("Migrated document {} from {} to S3 key {}", doc.getId(), localPath, key);
    }
}
