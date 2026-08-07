package com.careerflow.strategy;

import com.careerflow.audit.AuditAction;
import com.careerflow.audit.AuditLogService;
import com.careerflow.common.SecurityUtils;
import com.careerflow.common.WorkspaceAccessUtils;
import com.careerflow.exception.BadRequestException;
import com.careerflow.exception.ResourceNotFoundException;
import com.careerflow.opportunity.Opportunity;
import com.careerflow.opportunity.OpportunityRepository;
import com.careerflow.strategy.dto.StrategyItemReorderRequest;
import com.careerflow.strategy.dto.StrategyItemRequest;
import com.careerflow.strategy.dto.StrategyItemResponse;
import com.careerflow.strategy.dto.StrategyItemUpdateRequest;
import com.careerflow.strategy.dto.StrategyPlanResponse;
import com.careerflow.user.User;
import com.careerflow.workspace.Workspace;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class StrategyItemService {

    private final StrategyItemRepository strategyItemRepository;
    private final OpportunityRepository opportunityRepository;
    private final WorkspaceAccessUtils workspaceAccessUtils;
    private final SecurityUtils securityUtils;
    private final AuditLogService auditLogService;

    public StrategyItemResponse addItem(StrategyItemRequest request, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        Opportunity opportunity = findOwnedOpportunity(request.getOpportunityId(), user.getId(), workspaceId);
        Workspace workspace = workspaceAccessUtils.getOwnedWorkspace(workspaceId, user.getId());

        int sortOrder = request.getSortOrder() != null
                ? request.getSortOrder()
                : strategyItemRepository.findMaxSortOrder(opportunity.getId(), user.getId(), workspaceId) + 1;

        StrategyItem item = StrategyItem.builder()
                .user(user)
                .workspace(workspace)
                .opportunity(opportunity)
                .actionType(request.getActionType())
                .title(request.getTitle())
                .sortOrder(sortOrder)
                .dueDate(request.getDueDate())
                .status(request.getStatus() != null ? request.getStatus() : StrategyItemStatus.PLANNED)
                .notes(request.getNotes())
                .build();

        item = strategyItemRepository.save(item);
        auditLogService.log(user, AuditAction.STRATEGY_ITEM_CREATED, "Added strategy step for " + describe(item));
        return toResponse(item);
    }

    public StrategyPlanResponse getPlanForOpportunity(Long opportunityId, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        findOwnedOpportunity(opportunityId, user.getId(), workspaceId);

        List<StrategyItem> items = strategyItemRepository
                .findAllByOpportunityIdAndUserIdAndWorkspaceIdOrderBySortOrderAsc(opportunityId, user.getId(), workspaceId);
        return toPlanResponse(opportunityId, items);
    }

    public StrategyItemResponse updateItem(Long id, StrategyItemUpdateRequest request, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        StrategyItem item = findOwned(id, user.getId(), workspaceId);

        if (request.getActionType() != null) item.setActionType(request.getActionType());
        if (request.getTitle() != null && !request.getTitle().isBlank()) item.setTitle(request.getTitle());
        if (request.getDueDate() != null) item.setDueDate(request.getDueDate());
        if (request.getStatus() != null) item.setStatus(request.getStatus());
        if (request.getNotes() != null) item.setNotes(request.getNotes());
        if (request.getSortOrder() != null) item.setSortOrder(request.getSortOrder());

        item = strategyItemRepository.save(item);
        auditLogService.log(user, AuditAction.STRATEGY_ITEM_UPDATED, "Updated strategy step for " + describe(item));
        return toResponse(item);
    }

    public StrategyPlanResponse reorderItems(Long opportunityId, StrategyItemReorderRequest request, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        findOwnedOpportunity(opportunityId, user.getId(), workspaceId);

        List<StrategyItem> items = strategyItemRepository
                .findAllByOpportunityIdAndUserIdAndWorkspaceIdOrderBySortOrderAsc(opportunityId, user.getId(), workspaceId);
        Map<Long, StrategyItem> byId = new HashMap<>();
        items.forEach(i -> byId.put(i.getId(), i));

        if (request.getOrderedItemIds().size() != items.size() || !byId.keySet().containsAll(request.getOrderedItemIds()))
            throw new BadRequestException("Ordered item IDs must match the opportunity's existing strategy items exactly");

        for (int i = 0; i < request.getOrderedItemIds().size(); i++) {
            StrategyItem item = byId.get(request.getOrderedItemIds().get(i));
            item.setSortOrder(i);
        }
        strategyItemRepository.saveAll(items);
        auditLogService.log(user, AuditAction.STRATEGY_ITEM_REORDERED, "Reordered strategy for opportunity " + opportunityId);

        List<StrategyItem> reordered = strategyItemRepository
                .findAllByOpportunityIdAndUserIdAndWorkspaceIdOrderBySortOrderAsc(opportunityId, user.getId(), workspaceId);
        return toPlanResponse(opportunityId, reordered);
    }

    public void deleteItem(Long id, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        StrategyItem item = findOwned(id, user.getId(), workspaceId);
        item.softDelete();
        strategyItemRepository.save(item);
        auditLogService.log(user, AuditAction.STRATEGY_ITEM_DELETED, "Deleted strategy step for " + describe(item));
    }

    private StrategyPlanResponse toPlanResponse(Long opportunityId, List<StrategyItem> items) {
        long completed = items.stream().filter(i -> i.getStatus() == StrategyItemStatus.COMPLETED).count();
        long skipped = items.stream().filter(i -> i.getStatus() == StrategyItemStatus.SKIPPED).count();
        long actionable = items.size() - skipped;

        ReadinessState readiness;
        if (actionable == 0) {
            readiness = ReadinessState.READY_TO_APPLY;
        } else if (completed == actionable) {
            readiness = ReadinessState.READY_TO_APPLY;
        } else if (completed > 0 || items.stream().anyMatch(i -> i.getStatus() == StrategyItemStatus.IN_PROGRESS)) {
            readiness = ReadinessState.IN_PROGRESS;
        } else {
            readiness = ReadinessState.NOT_STARTED;
        }

        return StrategyPlanResponse.builder()
                .opportunityId(opportunityId)
                .items(items.stream().map(this::toResponse).toList())
                .readiness(readiness)
                .totalCount(items.size())
                .completedCount((int) completed)
                .skippedCount((int) skipped)
                .build();
    }

    private StrategyItem findOwned(Long id, Long userId, Long workspaceId) {
        return strategyItemRepository.findByIdAndUserIdAndWorkspaceId(id, userId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Strategy item not found"));
    }

    private Opportunity findOwnedOpportunity(Long opportunityId, Long userId, Long workspaceId) {
        return opportunityRepository.findByIdAndUserIdAndWorkspaceId(opportunityId, userId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Opportunity not found"));
    }

    private String describe(StrategyItem item) {
        return item.getTitle() + " (" + item.getOpportunity().getRoleTitle() + ")";
    }

    private StrategyItemResponse toResponse(StrategyItem item) {
        return StrategyItemResponse.builder()
                .id(item.getId())
                .opportunityId(item.getOpportunity().getId())
                .actionType(item.getActionType())
                .title(item.getTitle())
                .sortOrder(item.getSortOrder())
                .dueDate(item.getDueDate())
                .status(item.getStatus())
                .notes(item.getNotes())
                .createdAt(item.getCreatedAt())
                .updatedAt(item.getUpdatedAt())
                .build();
    }
}
