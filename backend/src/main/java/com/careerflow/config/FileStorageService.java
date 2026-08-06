package com.careerflow.config;

import com.careerflow.document.Document;
import com.careerflow.exception.BadRequestException;
import com.careerflow.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class FileStorageService {

    @Value("${aws.s3.bucket}")
    private String bucket;

    private final S3Client s3Client;

    public FileStorageService(S3Client s3Client) {
        this.s3Client = s3Client;
    }

    public Document storeDocument(MultipartFile file, String subfolder) {
        String raw = file.getOriginalFilename();
        String originalFilename = (raw != null && !raw.isBlank()) ? raw : "file";
        String extension = originalFilename.contains(".")
                ? originalFilename.substring(originalFilename.lastIndexOf("."))
                : "";

        String key = subfolder + "/" + UUID.randomUUID() + extension;

        try {
            s3Client.putObject(
                    PutObjectRequest.builder()
                            .bucket(bucket)
                            .key(key)
                            .contentType(file.getContentType())
                            .build(),
                    RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
        } catch (IOException | S3Exception e) {
            throw new BadRequestException("Failed to store file: " + e.getMessage());
        }

        return Document.builder()
                .originalName(originalFilename)
                .storedPath(key)
                .fileSize(file.getSize())
                .contentType(file.getContentType())
                .build();
    }

    /**
     * Loads a stored document by its {@code storedPath}. Pre-migration rows still hold an
     * absolute local filesystem path rather than an S3 key; those are read straight from disk
     * so old documents keep working until {@link LocalFileToS3MigrationRunner} moves them.
     */
    public Resource loadAsResource(String storedPath) {
        Path localPath = Paths.get(storedPath);
        if (localPath.isAbsolute()) {
            return loadLocalResource(localPath);
        }
        try {
            return new InputStreamResource(
                    s3Client.getObject(GetObjectRequest.builder().bucket(bucket).key(storedPath).build()));
        } catch (NoSuchKeyException e) {
            throw new ResourceNotFoundException("File not found on server");
        }
    }

    private Resource loadLocalResource(Path localPath) {
        try {
            Resource resource = new UrlResource(localPath.toUri());
            if (!resource.exists() || !resource.isReadable())
                throw new ResourceNotFoundException("File not found on server");
            return resource;
        } catch (MalformedURLException e) {
            throw new ResourceNotFoundException("File not found on server");
        }
    }
}
