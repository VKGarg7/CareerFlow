package com.careerflow.application;

import com.careerflow.application.dto.ApplicationRequest;
import com.careerflow.application.dto.ApplicationResponse;
import com.careerflow.application.dto.ApplicationStatsResponse;
import com.careerflow.application.dto.ApplicationUpdateRequest;
import com.careerflow.application.dto.DailyTrendItem;
import com.careerflow.application.dto.MonthlyTrendItem;
import com.careerflow.application.dto.SourceAnalysisItem;
import com.careerflow.common.PageResponse;
import com.careerflow.resume.dto.ResumeLinkHistoryResponse;
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
    public ResponseEntity<ApplicationResponse> addApplication(
            @Valid @RequestBody ApplicationRequest request,
            @RequestParam Long workspaceId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(applicationService.addApplication(request, workspaceId));
    }

    @GetMapping
    public ResponseEntity<PageResponse<ApplicationResponse>> getMyApplications(
            @RequestParam(required = false) Long companyId,
            @RequestParam(required = false) ApplicationStatus status,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String order,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam Long workspaceId) {
        return ResponseEntity.ok(applicationService.getMyApplications(companyId, status, sortBy, order, page, size, workspaceId));
    }

    @GetMapping("/stats")
    public ResponseEntity<ApplicationStatsResponse> getMyApplicationStats(@RequestParam Long workspaceId) {
        return ResponseEntity.ok(applicationService.getMyApplicationStats(workspaceId));
    }

    @GetMapping("/roles")
    public ResponseEntity<List<String>> getMyRoles(@RequestParam Long workspaceId) {
        return ResponseEntity.ok(applicationService.getMyRoles(workspaceId));
    }

    @GetMapping("/monthly-trend")
    public ResponseEntity<List<MonthlyTrendItem>> getMyMonthlyTrend(@RequestParam Long workspaceId) {
        return ResponseEntity.ok(applicationService.getMyMonthlyTrend(workspaceId));
    }

    @GetMapping("/source-analysis")
    public ResponseEntity<List<SourceAnalysisItem>> getMySourceAnalysis(@RequestParam Long workspaceId) {
        return ResponseEntity.ok(applicationService.getMySourceAnalysis(workspaceId));
    }

    @GetMapping("/resume-analysis")
    public ResponseEntity<List<com.careerflow.application.dto.ResumeAnalysisItem>> getMyResumeAnalysis(
            @RequestParam(required = false) String roleCategory,
            @RequestParam Long workspaceId) {
        return ResponseEntity.ok(applicationService.getMyResumeAnalysis(workspaceId, roleCategory));
    }

    @GetMapping("/weekly-trend")
    public ResponseEntity<List<DailyTrendItem>> getMyWeeklyTrend(
            @RequestParam(defaultValue = "14") int days,
            @RequestParam Long workspaceId) {
        return ResponseEntity.ok(applicationService.getMyWeeklyTrend(days, workspaceId));
    }

    @GetMapping("/deadlines")
    public ResponseEntity<List<ApplicationResponse>> getMyUpcomingDeadlines(
            @RequestParam(defaultValue = "7") int withinDays,
            @RequestParam Long workspaceId) {
        return ResponseEntity.ok(applicationService.getMyUpcomingDeadlines(withinDays, workspaceId));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApplicationResponse> updateApplication(
            @PathVariable Long id,
            @Valid @RequestBody ApplicationUpdateRequest request,
            @RequestParam Long workspaceId) {
        return ResponseEntity.ok(applicationService.updateApplication(id, request, workspaceId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(
            @PathVariable Long id,
            @RequestParam(required = false) Long documentId,
            @RequestParam Long workspaceId) {
        if (documentId != null) {
            return ResponseEntity.ok(applicationService.deleteDocument(id, documentId, workspaceId));
        }
        applicationService.deleteApplication(id, workspaceId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping(value = "/{id}/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApplicationResponse> uploadDocuments(
            @PathVariable Long id,
            @RequestPart(required = false) MultipartFile resume,
            @RequestPart(required = false) MultipartFile coverLetter,
            @RequestParam(required = false) Long profileResumeDocumentId,
            @RequestParam(required = false) Long resumeLibraryId,
            @RequestParam(required = false) Long coverLetterLibraryId,
            @RequestParam Long workspaceId) {
        return ResponseEntity.ok(applicationService.uploadDocuments(id, resume, coverLetter, profileResumeDocumentId, resumeLibraryId, coverLetterLibraryId, workspaceId));
    }

    @GetMapping("/{id}/resume-history")
    public ResponseEntity<List<ResumeLinkHistoryResponse>> getResumeHistory(
            @PathVariable Long id,
            @RequestParam Long workspaceId) {
        return ResponseEntity.ok(applicationService.getResumeHistory(id, workspaceId));
    }

    @GetMapping("/documents/{documentId}")
    public ResponseEntity<Resource> downloadDocument(
            @PathVariable Long documentId,
            @RequestParam(defaultValue = "false") boolean inline) {
        return applicationService.downloadDocument(documentId, inline);
    }
}
