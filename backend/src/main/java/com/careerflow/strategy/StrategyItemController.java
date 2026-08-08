package com.careerflow.strategy;

import com.careerflow.strategy.dto.StrategyItemReorderRequest;
import com.careerflow.strategy.dto.StrategyItemRequest;
import com.careerflow.strategy.dto.StrategyItemResponse;
import com.careerflow.strategy.dto.StrategyItemUpdateRequest;
import com.careerflow.strategy.dto.StrategyPlanResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/strategy-items")
@RequiredArgsConstructor
public class StrategyItemController {

    private final StrategyItemService strategyItemService;

    @PostMapping
    public ResponseEntity<StrategyItemResponse> addItem(
            @Valid @RequestBody StrategyItemRequest request,
            @RequestParam Long workspaceId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(strategyItemService.addItem(request, workspaceId));
    }

    @GetMapping
    public ResponseEntity<StrategyPlanResponse> getPlanForOpportunity(
            @RequestParam Long opportunityId,
            @RequestParam Long workspaceId) {
        return ResponseEntity.ok(strategyItemService.getPlanForOpportunity(opportunityId, workspaceId));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<StrategyItemResponse> updateItem(
            @PathVariable Long id,
            @Valid @RequestBody StrategyItemUpdateRequest request,
            @RequestParam Long workspaceId) {
        return ResponseEntity.ok(strategyItemService.updateItem(id, request, workspaceId));
    }

    @PutMapping("/reorder")
    public ResponseEntity<StrategyPlanResponse> reorderItems(
            @RequestParam Long opportunityId,
            @Valid @RequestBody StrategyItemReorderRequest request,
            @RequestParam Long workspaceId) {
        return ResponseEntity.ok(strategyItemService.reorderItems(opportunityId, request, workspaceId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteItem(
            @PathVariable Long id,
            @RequestParam Long workspaceId) {
        strategyItemService.deleteItem(id, workspaceId);
        return ResponseEntity.noContent().build();
    }
}
