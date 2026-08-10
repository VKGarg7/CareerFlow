package com.careerflow.coverletter;

import com.careerflow.common.PageResponse;
import com.careerflow.coverletter.dto.CoverLetterRequest;
import com.careerflow.coverletter.dto.CoverLetterResponse;
import com.careerflow.coverletter.dto.CoverLetterUpdateRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/cover-letters")
@RequiredArgsConstructor
public class CoverLetterController {

    private final CoverLetterService coverLetterService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<CoverLetterResponse> uploadCoverLetter(
            @RequestPart MultipartFile file,
            @Valid @RequestPart CoverLetterRequest metadata,
            @RequestParam Long workspaceId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(coverLetterService.uploadCoverLetter(file, metadata, workspaceId));
    }

    @GetMapping
    public ResponseEntity<PageResponse<CoverLetterResponse>> getMyCoverLetters(
            @RequestParam(required = false) Long id,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) CoverLetterStatus status,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String order,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam Long workspaceId) {
        return ResponseEntity.ok(coverLetterService.getMyCoverLetters(id, search, status, sortBy, order, page, size, workspaceId));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<CoverLetterResponse> updateCoverLetter(
            @PathVariable Long id,
            @Valid @RequestBody CoverLetterUpdateRequest request,
            @RequestParam Long workspaceId) {
        return ResponseEntity.ok(coverLetterService.updateCoverLetter(id, request, workspaceId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCoverLetter(
            @PathVariable Long id,
            @RequestParam(defaultValue = "false") boolean force,
            @RequestParam Long workspaceId) {
        coverLetterService.deleteCoverLetter(id, force, workspaceId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/documents/{documentId}")
    public ResponseEntity<Resource> downloadDocument(
            @PathVariable Long documentId,
            @RequestParam(defaultValue = "false") boolean inline) {
        return coverLetterService.downloadDocument(documentId, inline);
    }
}
