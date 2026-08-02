package com.careerflow.config;

import com.careerflow.document.Document;
import com.careerflow.exception.BadRequestException;
import com.careerflow.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;

import java.io.IOException;
import java.io.InputStream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@SuppressWarnings("null")
class FileStorageServiceTest {

    private S3Client s3Client;
    private FileStorageService fileStorageService;

    @BeforeEach
    void setUp() {
        s3Client = mock(S3Client.class);
        fileStorageService = new FileStorageService(s3Client);
        ReflectionTestUtils.setField(fileStorageService, "bucket", "test-bucket");
    }

    @Test
    void storeDocument_putsObjectToS3_andReturnsDocumentMetadata() {
        MockMultipartFile file = new MockMultipartFile(
                "resume", "resume.pdf", "application/pdf", "content".getBytes());

        Document document = fileStorageService.storeDocument(file, "resumes");

        assertThat(document.getOriginalName()).isEqualTo("resume.pdf");
        assertThat(document.getContentType()).isEqualTo("application/pdf");
        assertThat(document.getFileSize()).isEqualTo(7L);
        assertThat(document.getStoredPath()).startsWith("resumes/").endsWith(".pdf");
    }

    @Test
    void storeDocument_defaultsToFile_whenOriginalFilenameIsNull() throws IOException {
        MultipartFile file = mock(MultipartFile.class);
        when(file.getOriginalFilename()).thenReturn(null);
        when(file.getInputStream()).thenReturn(InputStream.nullInputStream());
        when(file.getSize()).thenReturn(0L);

        Document document = fileStorageService.storeDocument(file, "resumes");

        assertThat(document.getOriginalName()).isEqualTo("file");
        assertThat(document.getStoredPath()).doesNotContain(".pdf", ".doc", ".docx");
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

    @Test
    void storeDocument_throwsBadRequestException_whenS3PutFails() {
        MockMultipartFile file = new MockMultipartFile(
                "resume", "resume.pdf", "application/pdf", "content".getBytes());
        when(s3Client.putObject(any(PutObjectRequest.class), any(RequestBody.class)))
                .thenThrow(S3Exception.builder().message("upload failed").build());

        assertThatThrownBy(() -> fileStorageService.storeDocument(file, "resumes"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Failed to store file");
    }

    @Test
    void loadAsResource_returnsResource_whenObjectExists() throws IOException {
        ResponseInputStream<GetObjectResponse> responseStream = new ResponseInputStream<>(
                GetObjectResponse.builder().build(),
                software.amazon.awssdk.http.AbortableInputStream.create(
                        new java.io.ByteArrayInputStream("content".getBytes())));
        when(s3Client.getObject(any(GetObjectRequest.class))).thenReturn(responseStream);

        var resource = fileStorageService.loadAsResource("resumes/some-key.pdf");

        assertThat(resource.getInputStream().readAllBytes()).isEqualTo("content".getBytes());
    }

    @Test
    void loadAsResource_throwsResourceNotFoundException_whenKeyMissing() {
        when(s3Client.getObject(any(GetObjectRequest.class))).thenThrow(NoSuchKeyException.builder().build());

        assertThatThrownBy(() -> fileStorageService.loadAsResource("resumes/missing.pdf"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("File not found on server");
    }
}
