package com.careerflow.goal;

import com.careerflow.common.PageResponse;
import com.careerflow.goal.dto.GoalRequest;
import com.careerflow.goal.dto.GoalResponse;
import com.careerflow.goal.dto.GoalUpdateRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/goals")
@RequiredArgsConstructor
public class GoalController {

    private final GoalService goalService;

    @PostMapping
    public ResponseEntity<GoalResponse> addGoal(
            @Valid @RequestBody GoalRequest request,
            @RequestParam Long workspaceId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(goalService.addGoal(request, workspaceId));
    }

    @GetMapping
    public ResponseEntity<PageResponse<GoalResponse>> getMyGoals(
            @RequestParam(required = false) Long id,
            @RequestParam(required = false) GoalStatus status,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String order,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam Long workspaceId) {
        return ResponseEntity.ok(goalService.getMyGoals(id, status, sortBy, order, page, size, workspaceId));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<GoalResponse> updateGoal(
            @PathVariable Long id,
            @Valid @RequestBody GoalUpdateRequest request,
            @RequestParam Long workspaceId) {
        return ResponseEntity.ok(goalService.updateGoal(id, request, workspaceId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGoal(
            @PathVariable Long id,
            @RequestParam Long workspaceId) {
        goalService.deleteGoal(id, workspaceId);
        return ResponseEntity.noContent().build();
    }
}
