package com.careerflow.config;

import com.careerflow.document.Document;
import com.careerflow.exception.BadRequestException;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class FileStorageService {

    @Value("${app.upload-dir}")
    private String uploadDir;

    @PostConstruct
    public void init() throws IOException {
        Files.createDirectories(Paths.get(uploadDir));
    }

    public Document storeDocument(MultipartFile file, String subfolder) {
        String raw = file.getOriginalFilename();
        String originalFilename = (raw != null && !raw.isBlank()) ? raw : "file";
        String extension = originalFilename.contains(".")
                ? originalFilename.substring(originalFilename.lastIndexOf("."))
                : "";

        String storedFilename = UUID.randomUUID() + extension;
        Path dir = Paths.get(uploadDir, subfolder);
        Path filePath = dir.resolve(storedFilename);

        try {
            Files.createDirectories(dir);
            Files.copy(file.getInputStream(), filePath);
        } catch (IOException e) {
            throw new BadRequestException("Failed to store file: " + e.getMessage());
        }

        return Document.builder()
                .originalName(originalFilename)
                .storedPath(filePath.toString())
                .fileSize(file.getSize())
                .contentType(file.getContentType())
                .build();
    }
}
