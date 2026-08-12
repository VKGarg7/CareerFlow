package com.careerflow.followuprule;

import com.careerflow.common.PageResponse;
import com.careerflow.followuprule.dto.FollowUpRuleRequest;
import com.careerflow.followuprule.dto.FollowUpRuleResponse;
import com.careerflow.followuprule.dto.FollowUpRuleUpdateRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/follow-up-rules")
@RequiredArgsConstructor
public class FollowUpRuleController {

    private final FollowUpRuleService followUpRuleService;

    @PostMapping
    public ResponseEntity<FollowUpRuleResponse> addRule(
            @Valid @RequestBody FollowUpRuleRequest request,
            @RequestParam Long workspaceId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(followUpRuleService.addRule(request, workspaceId));
    }

    @GetMapping
    public ResponseEntity<PageResponse<FollowUpRuleResponse>> getMyRules(
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String order,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam Long workspaceId) {
        return ResponseEntity.ok(followUpRuleService.getMyRules(sortBy, order, page, size, workspaceId));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<FollowUpRuleResponse> updateRule(
            @PathVariable Long id,
            @Valid @RequestBody FollowUpRuleUpdateRequest request,
            @RequestParam Long workspaceId) {
        return ResponseEntity.ok(followUpRuleService.updateRule(id, request, workspaceId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRule(
            @PathVariable Long id,
            @RequestParam Long workspaceId) {
        followUpRuleService.deleteRule(id, workspaceId);
        return ResponseEntity.noContent().build();
    }
}
