package com.careerflow.resume;

import com.careerflow.common.PageResponse;
import com.careerflow.resume.dto.ResumeRequest;
import com.careerflow.resume.dto.ResumeResponse;
import com.careerflow.resume.dto.ResumeUpdateRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/resumes")
@RequiredArgsConstructor
public class ResumeController {

    private final ResumeService resumeService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ResumeResponse> uploadResume(
            @RequestPart MultipartFile file,
            @Valid @RequestPart ResumeRequest metadata,
            @RequestParam Long workspaceId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(resumeService.uploadResume(file, metadata, workspaceId));
    }

    @GetMapping
    public ResponseEntity<PageResponse<ResumeResponse>> getMyResumes(
            @RequestParam(required = false) Long id,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) ResumeStatus status,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String order,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam Long workspaceId) {
        return ResponseEntity.ok(resumeService.getMyResumes(id, search, status, sortBy, order, page, size, workspaceId));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ResumeResponse> updateResume(
            @PathVariable Long id,
            @Valid @RequestBody ResumeUpdateRequest request,
            @RequestParam Long workspaceId) {
        return ResponseEntity.ok(resumeService.updateResume(id, request, workspaceId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteResume(
            @PathVariable Long id,
            @RequestParam(defaultValue = "false") boolean force,
            @RequestParam Long workspaceId) {
        resumeService.deleteResume(id, force, workspaceId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/documents/{documentId}")
    public ResponseEntity<Resource> downloadDocument(
            @PathVariable Long documentId,
            @RequestParam(defaultValue = "false") boolean inline) {
        return resumeService.downloadDocument(documentId, inline);
    }
}
