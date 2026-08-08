package com.careerflow.rolefit;

import com.careerflow.rolefit.dto.RoleFitEvaluationRequest;
import com.careerflow.rolefit.dto.RoleFitEvaluationResponse;
import com.careerflow.rolefit.dto.RoleFitEvaluationUpdateRequest;
import com.careerflow.rolefit.dto.RoleFitOverrideRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/role-fit-evaluations")
@RequiredArgsConstructor
public class RoleFitEvaluationController {

    private final RoleFitEvaluationService roleFitEvaluationService;

    @PostMapping
    public ResponseEntity<RoleFitEvaluationResponse> addEvaluation(
            @Valid @RequestBody RoleFitEvaluationRequest request,
            @RequestParam Long workspaceId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(roleFitEvaluationService.addEvaluation(request, workspaceId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<RoleFitEvaluationResponse> getEvaluation(
            @PathVariable Long id,
            @RequestParam Long workspaceId) {
        return ResponseEntity.ok(roleFitEvaluationService.getEvaluation(id, workspaceId));
    }

    @GetMapping
    public ResponseEntity<RoleFitEvaluationResponse> getEvaluationForOpportunity(
            @RequestParam Long opportunityId,
            @RequestParam Long workspaceId) {
        return ResponseEntity.ok(roleFitEvaluationService.getEvaluationForOpportunity(opportunityId, workspaceId));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<RoleFitEvaluationResponse> updateEvaluation(
            @PathVariable Long id,
            @Valid @RequestBody RoleFitEvaluationUpdateRequest request,
            @RequestParam Long workspaceId) {
        return ResponseEntity.ok(roleFitEvaluationService.updateEvaluation(id, request, workspaceId));
    }

    @PatchMapping("/{id}/override")
    public ResponseEntity<RoleFitEvaluationResponse> overrideEvaluation(
            @PathVariable Long id,
            @Valid @RequestBody RoleFitOverrideRequest request,
            @RequestParam Long workspaceId) {
        return ResponseEntity.ok(roleFitEvaluationService.overrideEvaluation(id, request, workspaceId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEvaluation(
            @PathVariable Long id,
            @RequestParam Long workspaceId) {
        roleFitEvaluationService.deleteEvaluation(id, workspaceId);
        return ResponseEntity.noContent().build();
    }
}
