package com.careerflow.application;

import com.careerflow.application.dto.ApplicationRequest;
import com.careerflow.application.dto.ApplicationResponse;
import com.careerflow.application.dto.ApplicationUpdateRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/applications")
@RequiredArgsConstructor
public class ApplicationController {

    private final ApplicationService applicationService;

    @PostMapping
    public ResponseEntity<ApplicationResponse> addApplication(@Valid @RequestBody ApplicationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(applicationService.addApplication(request));
    }

    @GetMapping
    public ResponseEntity<List<ApplicationResponse>> getMyApplications(
            @RequestParam(required = false) Long companyId,
            @RequestParam(required = false) ApplicationStatus status,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String order) {
        return ResponseEntity.ok(applicationService.getMyApplications(companyId, status, sortBy, order));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApplicationResponse> updateApplication(
            @PathVariable Long id,
            @Valid @RequestBody ApplicationUpdateRequest request) {
        return ResponseEntity.ok(applicationService.updateApplication(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(
            @PathVariable Long id,
            @RequestParam(required = false) Long documentId) {
        if (documentId != null) {
            return ResponseEntity.ok(applicationService.deleteDocument(id, documentId));
        }
        applicationService.deleteApplication(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping(value = "/{id}/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApplicationResponse> uploadDocuments(
            @PathVariable Long id,
            @RequestPart(required = false) MultipartFile resume,
            @RequestPart(required = false) MultipartFile coverLetter,
            @RequestParam(required = false) Long profileResumeDocumentId) {
        return ResponseEntity.ok(applicationService.uploadDocuments(id, resume, coverLetter, profileResumeDocumentId));
    }

    @GetMapping("/documents/{documentId}")
    public ResponseEntity<Resource> downloadDocument(
            @PathVariable Long documentId,
            @RequestParam(defaultValue = "false") boolean inline) {
        return applicationService.downloadDocument(documentId, inline);
    }
}
