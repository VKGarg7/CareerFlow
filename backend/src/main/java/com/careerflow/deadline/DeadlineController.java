package com.careerflow.deadline;

import com.careerflow.actionitem.ActionableEntityType;
import com.careerflow.common.PageResponse;
import com.careerflow.deadline.dto.DeadlineRequest;
import com.careerflow.deadline.dto.DeadlineResponse;
import com.careerflow.deadline.dto.DeadlineUpdateRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/deadlines")
@RequiredArgsConstructor
public class DeadlineController {

    private final DeadlineService deadlineService;

    @PostMapping
    public ResponseEntity<DeadlineResponse> addDeadline(
            @Valid @RequestBody DeadlineRequest request,
            @RequestParam Long workspaceId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(deadlineService.addDeadline(request, workspaceId));
    }

    @GetMapping
    public ResponseEntity<PageResponse<DeadlineResponse>> getMyDeadlines(
            @RequestParam(required = false) Long id,
            @RequestParam(required = false) DeadlineStatus status,
            @RequestParam(defaultValue = "dueAt") String sortBy,
            @RequestParam(defaultValue = "asc") String order,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam Long workspaceId) {
        return ResponseEntity.ok(deadlineService.getMyDeadlines(id, status, sortBy, order, page, size, workspaceId));
    }

    @GetMapping("/upcoming")
    public ResponseEntity<List<DeadlineResponse>> getUpcomingDeadlines(
            @RequestParam(defaultValue = "7") int withinDays,
            @RequestParam Long workspaceId) {
        return ResponseEntity.ok(deadlineService.getUpcomingDeadlines(withinDays, workspaceId));
    }

    @GetMapping("/for-entity")
    public ResponseEntity<List<DeadlineResponse>> getDeadlinesForEntity(
            @RequestParam ActionableEntityType entityType,
            @RequestParam Long entityId,
            @RequestParam Long workspaceId) {
        return ResponseEntity.ok(deadlineService.getDeadlinesForEntity(entityType, entityId, workspaceId));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<DeadlineResponse> updateDeadline(
            @PathVariable Long id,
            @Valid @RequestBody DeadlineUpdateRequest request,
            @RequestParam Long workspaceId) {
        return ResponseEntity.ok(deadlineService.updateDeadline(id, request, workspaceId));
    }

    @PatchMapping("/{id}/complete")
    public ResponseEntity<DeadlineResponse> completeDeadline(
            @PathVariable Long id,
            @RequestParam Long workspaceId) {
        return ResponseEntity.ok(deadlineService.completeDeadline(id, workspaceId));
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<DeadlineResponse> cancelDeadline(
            @PathVariable Long id,
            @RequestParam Long workspaceId) {
        return ResponseEntity.ok(deadlineService.cancelDeadline(id, workspaceId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDeadline(
            @PathVariable Long id,
            @RequestParam Long workspaceId) {
        deadlineService.deleteDeadline(id, workspaceId);
        return ResponseEntity.noContent().build();
    }
}
