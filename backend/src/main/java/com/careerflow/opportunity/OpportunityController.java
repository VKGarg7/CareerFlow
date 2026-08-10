package com.careerflow.opportunity;

import com.careerflow.application.dto.ApplicationResponse;
import com.careerflow.common.PageResponse;
import com.careerflow.opportunity.dto.DuplicateCheckRequest;
import com.careerflow.opportunity.dto.DuplicateMatch;
import com.careerflow.opportunity.dto.OpportunityConvertRequest;
import com.careerflow.opportunity.dto.OpportunityRequest;
import com.careerflow.opportunity.dto.OpportunityResponse;
import com.careerflow.opportunity.dto.OpportunityUpdateRequest;
import com.careerflow.resume.dto.ResumeLinkHistoryResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/opportunities")
@RequiredArgsConstructor
public class OpportunityController {

    private final OpportunityService opportunityService;

    @PostMapping
    public ResponseEntity<OpportunityResponse> addOpportunity(
            @Valid @RequestBody OpportunityRequest request,
            @RequestParam Long workspaceId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(opportunityService.addOpportunity(request, workspaceId));
    }

    @GetMapping
    public ResponseEntity<PageResponse<OpportunityResponse>> getMyOpportunities(
            @RequestParam(required = false) Long id,
            @RequestParam(required = false) Long companyId,
            @RequestParam(required = false) OpportunityStatus status,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String order,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam Long workspaceId) {
        return ResponseEntity.ok(opportunityService.getMyOpportunities(id, companyId, status, sortBy, order, page, size, workspaceId));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<OpportunityResponse> updateOpportunity(
            @PathVariable Long id,
            @Valid @RequestBody OpportunityUpdateRequest request,
            @RequestParam Long workspaceId) {
        return ResponseEntity.ok(opportunityService.updateOpportunity(id, request, workspaceId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOpportunity(
            @PathVariable Long id,
            @RequestParam Long workspaceId) {
        opportunityService.deleteOpportunity(id, workspaceId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/check-duplicates")
    public ResponseEntity<List<DuplicateMatch>> checkDuplicates(
            @Valid @RequestBody DuplicateCheckRequest request,
            @RequestParam Long workspaceId) {
        return ResponseEntity.ok(opportunityService.checkDuplicates(request, workspaceId));
    }

    @GetMapping("/{id}/resume-history")
    public ResponseEntity<List<ResumeLinkHistoryResponse>> getResumeHistory(
            @PathVariable Long id,
            @RequestParam Long workspaceId) {
        return ResponseEntity.ok(opportunityService.getResumeHistory(id, workspaceId));
    }

    @PostMapping("/{id}/convert")
    public ResponseEntity<ApplicationResponse> convertToApplication(
            @PathVariable Long id,
            @RequestBody(required = false) OpportunityConvertRequest request,
            @RequestParam Long workspaceId) {
        OpportunityConvertRequest body = request != null ? request : new OpportunityConvertRequest();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(opportunityService.convertToApplication(id, body, workspaceId));
    }
}
