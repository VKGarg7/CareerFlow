package com.careerflow.config;

import com.careerflow.document.Document;
import com.careerflow.exception.BadRequestException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@SuppressWarnings("null")
class FileStorageServiceTest {

    private FileStorageService fileStorageService;

    @TempDir
    Path tempDir;

    @BeforeEach
    void setUp() {
        fileStorageService = new FileStorageService();
        ReflectionTestUtils.setField(fileStorageService, "uploadDir", tempDir.toString());
    }

    @Test
    void storeDocument_writesFileToDisk_andReturnsDocumentMetadata() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
                "resume", "resume.pdf", "application/pdf", "content".getBytes());

        Document document = fileStorageService.storeDocument(file, "resumes");

        assertThat(document.getOriginalName()).isEqualTo("resume.pdf");
        assertThat(document.getContentType()).isEqualTo("application/pdf");
        assertThat(document.getFileSize()).isEqualTo(7L);
        assertThat(Files.exists(Path.of(document.getStoredPath()))).isTrue();
        assertThat(document.getStoredPath()).endsWith(".pdf");
    }

    @Test
    void storeDocument_defaultsToFile_whenOriginalFilenameIsNull() throws IOException {
        MultipartFile file = mock(MultipartFile.class);
        when(file.getOriginalFilename()).thenReturn(null);
        when(file.getInputStream()).thenReturn(InputStream.nullInputStream());
        when(file.getSize()).thenReturn(0L);

        Document document = fileStorageService.storeDocument(file, "resumes");

        assertThat(document.getOriginalName()).isEqualTo("file");
        assertThat(document.getStoredPath()).doesNotContain(".");
    }

    @Test
    void storeDocument_throwsBadRequestException_whenInputStreamFails() throws IOException {
        MultipartFile file = mock(MultipartFile.class);
        when(file.getOriginalFilename()).thenReturn("resume.pdf");
        when(file.getInputStream()).thenThrow(new IOException("disk error"));

        assertThatThrownBy(() -> fileStorageService.storeDocument(file, "resumes"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Failed to store file");
    }
}
