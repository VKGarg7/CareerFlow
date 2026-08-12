package com.careerflow.actionitem;

import com.careerflow.actionitem.dto.ActionItemRequest;
import com.careerflow.actionitem.dto.ActionItemResponse;
import com.careerflow.actionitem.dto.ActionItemUpdateRequest;
import com.careerflow.common.PageResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/action-items")
@RequiredArgsConstructor
public class ActionItemController {

    private final ActionItemService actionItemService;

    @PostMapping
    public ResponseEntity<ActionItemResponse> addActionItem(
            @Valid @RequestBody ActionItemRequest request,
            @RequestParam Long workspaceId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(actionItemService.addActionItem(request, workspaceId));
    }

    @GetMapping
    public ResponseEntity<PageResponse<ActionItemResponse>> getMyActionItems(
            @RequestParam(required = false) Long id,
            @RequestParam(required = false) ActionStatus status,
            @RequestParam(required = false) ActionType type,
            @RequestParam(defaultValue = "dueDate") String sortBy,
            @RequestParam(defaultValue = "asc") String order,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam Long workspaceId) {
        return ResponseEntity.ok(actionItemService.getMyActionItems(id, status, type, sortBy, order, page, size, workspaceId));
    }

    @GetMapping("/for-entity")
    public ResponseEntity<List<ActionItemResponse>> getActionItemsForEntity(
            @RequestParam ActionableEntityType entityType,
            @RequestParam Long entityId,
            @RequestParam Long workspaceId) {
        return ResponseEntity.ok(actionItemService.getActionItemsForEntity(entityType, entityId, workspaceId));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ActionItemResponse> updateActionItem(
            @PathVariable Long id,
            @Valid @RequestBody ActionItemUpdateRequest request,
            @RequestParam Long workspaceId) {
        return ResponseEntity.ok(actionItemService.updateActionItem(id, request, workspaceId));
    }

    @PatchMapping("/{id}/complete")
    public ResponseEntity<ActionItemResponse> completeActionItem(
            @PathVariable Long id,
            @RequestParam Long workspaceId) {
        return ResponseEntity.ok(actionItemService.completeActionItem(id, workspaceId));
    }

    @PatchMapping("/{id}/snooze")
    public ResponseEntity<ActionItemResponse> snoozeActionItem(
            @PathVariable Long id,
            @RequestParam LocalDate until,
            @RequestParam Long workspaceId) {
        return ResponseEntity.ok(actionItemService.snoozeActionItem(id, until, workspaceId));
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<ActionItemResponse> cancelActionItem(
            @PathVariable Long id,
            @RequestParam Long workspaceId) {
        return ResponseEntity.ok(actionItemService.cancelActionItem(id, workspaceId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteActionItem(
            @PathVariable Long id,
            @RequestParam Long workspaceId) {
        actionItemService.deleteActionItem(id, workspaceId);
        return ResponseEntity.noContent().build();
    }
}
