package com.careerflow.followup;

import com.careerflow.common.PageResponse;
import com.careerflow.followup.dto.FollowUpRequest;
import com.careerflow.followup.dto.FollowUpResponse;
import com.careerflow.followup.dto.FollowUpUpdateRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class FollowUpController {

    private final FollowUpService followUpService;

    @PostMapping("/api/applications/{applicationId}/follow-ups")
    public ResponseEntity<FollowUpResponse> create(
            @PathVariable Long applicationId,
            @Valid @RequestBody FollowUpRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(followUpService.createFollowUp(applicationId, request));
    }

    @GetMapping("/api/applications/{applicationId}/follow-ups")
    public ResponseEntity<List<FollowUpResponse>> getForApplication(@PathVariable Long applicationId) {
        return ResponseEntity.ok(followUpService.getFollowUpsForApplication(applicationId));
    }

    @GetMapping("/api/follow-ups")
    public ResponseEntity<PageResponse<FollowUpResponse>> getAll(
            @RequestParam(required = false) FollowUpStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(followUpService.getAllFollowUps(status, page, size));
    }

    @PatchMapping("/api/follow-ups/{id}")
    public ResponseEntity<FollowUpResponse> update(
            @PathVariable Long id,
            @RequestBody FollowUpUpdateRequest request) {
        return ResponseEntity.ok(followUpService.updateFollowUp(id, request));
    }

    @DeleteMapping("/api/follow-ups/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        followUpService.deleteFollowUp(id);
        return ResponseEntity.noContent().build();
    }
}
