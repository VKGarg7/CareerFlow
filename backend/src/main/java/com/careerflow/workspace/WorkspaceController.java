package com.careerflow.workspace;

import com.careerflow.common.PageResponse;
import com.careerflow.workspace.dto.WorkspaceRequest;
import com.careerflow.workspace.dto.WorkspaceResponse;
import com.careerflow.workspace.dto.WorkspaceUpdateRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/workspaces")
@RequiredArgsConstructor
public class WorkspaceController {

    private final WorkspaceService workspaceService;

    @PostMapping
    public ResponseEntity<WorkspaceResponse> addWorkspace(@Valid @RequestBody WorkspaceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(workspaceService.addWorkspace(request));
    }

    @GetMapping
    public ResponseEntity<PageResponse<WorkspaceResponse>> getMyWorkspaces(
            @RequestParam(required = false) Long id,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) WorkspaceStatus status,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String order,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(workspaceService.getMyWorkspaces(id, search, status, sortBy, order, page, size));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<WorkspaceResponse> updateWorkspace(
            @PathVariable Long id,
            @Valid @RequestBody WorkspaceUpdateRequest request) {
        return ResponseEntity.ok(workspaceService.updateWorkspace(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteWorkspace(@PathVariable Long id) {
        workspaceService.deleteWorkspace(id);
        return ResponseEntity.noContent().build();
    }
}
