package com.careerflow.actionitem;

import com.careerflow.actionitem.dto.ActionItemRequest;
import com.careerflow.actionitem.dto.ActionItemResponse;
import com.careerflow.actionitem.dto.ActionItemUpdateRequest;
import com.careerflow.audit.AuditAction;
import com.careerflow.audit.AuditLogService;
import com.careerflow.common.PageResponse;
import com.careerflow.common.PaginationHelper;
import com.careerflow.common.SecurityUtils;
import com.careerflow.common.WorkspaceAccessUtils;
import com.careerflow.exception.BadRequestException;
import com.careerflow.exception.ResourceNotFoundException;
import com.careerflow.timeline.TimelineEventType;
import com.careerflow.timeline.TimelineService;
import com.careerflow.user.User;
import com.careerflow.workspace.Workspace;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;
import java.util.Set;

@SuppressWarnings("null")
@Service
@RequiredArgsConstructor
public class ActionItemService {

    private static final Set<String> SORTABLE_FIELDS =
            Set.of("title", "status", "priority", "dueDate", "createdAt", "updatedAt");

    private final ActionItemRepository actionItemRepository;
    private final WorkspaceAccessUtils workspaceAccessUtils;
    private final SecurityUtils securityUtils;
    private final AuditLogService auditLogService;
    private final TimelineService timelineService;

    public ActionItemResponse addActionItem(ActionItemRequest request, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        Workspace workspace = workspaceAccessUtils.getOwnedWorkspace(workspaceId, user.getId());
        validateEntityLink(request.getEntityType(), request.getEntityId());

        ActionItem actionItem = ActionItem.builder()
                .user(user)
                .workspace(workspace)
                .title(request.getTitle())
                .type(request.getType())
                .status(request.getStatus() != null ? request.getStatus() : ActionStatus.OPEN)
                .priority(request.getPriority() != null ? request.getPriority() : ActionPriority.MEDIUM)
                .dueDate(request.getDueDate())
                .entityType(request.getEntityType())
                .entityId(request.getEntityId())
                .notes(request.getNotes())
                .build();

        actionItem = actionItemRepository.save(actionItem);
        auditLogService.log(user, AuditAction.ACTION_ITEM_CREATED, "Created action item: " + actionItem.getTitle());
        return toResponse(actionItem);
    }

    public PageResponse<ActionItemResponse> getMyActionItems(
            Long id, ActionStatus status, ActionType type,
            String sortBy, String order, int page, int size, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        if (id != null) {
            return PageResponse.single(toResponse(findOwned(id, user.getId(), workspaceId)));
        }
        Pageable pageable = PaginationHelper.build(page, size, sortBy, order, SORTABLE_FIELDS);

        Page<ActionItem> results;
        if (status != null && type != null) {
            results = actionItemRepository.findAllByUserIdAndWorkspaceIdAndStatusAndType(
                    user.getId(), workspaceId, status, type, pageable);
        } else if (status != null) {
            results = actionItemRepository.findAllByUserIdAndWorkspaceIdAndStatus(
                    user.getId(), workspaceId, status, pageable);
        } else if (type != null) {
            results = actionItemRepository.findAllByUserIdAndWorkspaceIdAndType(
                    user.getId(), workspaceId, type, pageable);
        } else {
            results = actionItemRepository.findAllByUserIdAndWorkspaceId(user.getId(), workspaceId, pageable);
        }
        return PageResponse.of(results.map(this::toResponse));
    }

    public Map<String, List<ActionItemResponse>> getOverdueAndDueTodayActions(Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        LocalDate today = LocalDate.now();
        List<ActionItem> openDueByToday = actionItemRepository
                .findAllByUserIdAndWorkspaceIdAndStatusAndDueDateLessThanEqual(user.getId(), workspaceId, ActionStatus.OPEN, today);
        List<ActionItem> inProgressDueByToday = actionItemRepository
                .findAllByUserIdAndWorkspaceIdAndStatusAndDueDateLessThanEqual(user.getId(), workspaceId, ActionStatus.IN_PROGRESS, today);

        List<ActionItemResponse> overdue = new ArrayList<>();
        List<ActionItemResponse> dueToday = new ArrayList<>();
        for (ActionItem item : Stream.concat(openDueByToday.stream(), inProgressDueByToday.stream()).toList()) {
            ActionItemResponse response = toResponse(item);
            (item.getDueDate().isBefore(today) ? overdue : dueToday).add(response);
        }
        return Map.of("overdue", overdue, "dueToday", dueToday);
    }

    public List<ActionItemResponse> getActionItemsForEntity(ActionableEntityType entityType, Long entityId, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        return actionItemRepository
                .findAllByUserIdAndWorkspaceIdAndEntityTypeAndEntityId(user.getId(), workspaceId, entityType, entityId)
                .stream().map(this::toResponse).toList();
    }

    public ActionItemResponse updateActionItem(Long id, ActionItemUpdateRequest request, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        ActionItem actionItem = findOwned(id, user.getId(), workspaceId);

        if (request.getTitle() != null && !request.getTitle().isBlank()) actionItem.setTitle(request.getTitle());
        if (request.getType() != null) actionItem.setType(request.getType());
        if (request.getPriority() != null) actionItem.setPriority(request.getPriority());
        if (request.getDueDate() != null) actionItem.setDueDate(request.getDueDate());
        if (request.getNotes() != null) actionItem.setNotes(request.getNotes());

        if (Boolean.TRUE.equals(request.getUnlinkEntity())) {
            actionItem.setEntityType(null);
            actionItem.setEntityId(null);
        } else if (request.getEntityType() != null || request.getEntityId() != null) {
            validateEntityLink(request.getEntityType(), request.getEntityId());
            actionItem.setEntityType(request.getEntityType());
            actionItem.setEntityId(request.getEntityId());
        }

        if (request.getStatus() != null) {
            applyStatusChange(actionItem, request.getStatus(), request.getSnoozedUntil());
        }

        actionItem = actionItemRepository.save(actionItem);
        auditLogService.log(user, AuditAction.ACTION_ITEM_UPDATED, "Updated action item: " + actionItem.getTitle());
        return toResponse(actionItem);
    }

    public ActionItemResponse completeActionItem(Long id, Long workspaceId) {
        return transitionStatus(id, workspaceId, ActionStatus.COMPLETED, null, AuditAction.ACTION_ITEM_COMPLETED);
    }

    public ActionItemResponse snoozeActionItem(Long id, LocalDate snoozedUntil, Long workspaceId) {
        if (snoozedUntil == null) throw new BadRequestException("snoozedUntil is required to snooze an action item");
        return transitionStatus(id, workspaceId, ActionStatus.SNOOZED, snoozedUntil, AuditAction.ACTION_ITEM_SNOOZED);
    }

    public ActionItemResponse cancelActionItem(Long id, Long workspaceId) {
        return transitionStatus(id, workspaceId, ActionStatus.CANCELLED, null, AuditAction.ACTION_ITEM_CANCELLED);
    }

    private ActionItemResponse transitionStatus(Long id, Long workspaceId, ActionStatus status, LocalDate snoozedUntil, AuditAction auditAction) {
        User user = securityUtils.getCurrentUser();
        ActionItem actionItem = findOwned(id, user.getId(), workspaceId);
        applyStatusChange(actionItem, status, snoozedUntil);
        actionItem = actionItemRepository.save(actionItem);
        auditLogService.log(user, auditAction, "Action item " + status.name().toLowerCase() + ": " + actionItem.getTitle());
        if (status == ActionStatus.COMPLETED && actionItem.getEntityType() != null && actionItem.getEntityId() != null) {
            timelineService.record(user, actionItem.getWorkspace(), actionItem.getEntityType(), actionItem.getEntityId(),
                    actionItem.getTitle(), TimelineEventType.ACTION_COMPLETED, "Completed: " + actionItem.getTitle());
        }
        return toResponse(actionItem);
    }

    private void applyStatusChange(ActionItem actionItem, ActionStatus newStatus, LocalDate snoozedUntil) {
        if (newStatus == ActionStatus.SNOOZED) {
            if (snoozedUntil == null) throw new BadRequestException("snoozedUntil is required to snooze an action item");
            actionItem.setSnoozedUntil(snoozedUntil);
        } else {
            actionItem.setSnoozedUntil(null);
        }
        actionItem.setCompletedAt(newStatus == ActionStatus.COMPLETED ? LocalDateTime.now() : null);
        actionItem.setStatus(newStatus);
    }

    public void deleteActionItem(Long id, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        ActionItem actionItem = findOwned(id, user.getId(), workspaceId);
        actionItem.softDelete();
        actionItemRepository.save(actionItem);
        auditLogService.log(user, AuditAction.ACTION_ITEM_DELETED, "Deleted action item: " + actionItem.getTitle());
    }

    private void validateEntityLink(ActionableEntityType entityType, Long entityId) {
        if ((entityType == null) != (entityId == null)) {
            throw new BadRequestException("entityType and entityId must be provided together");
        }
    }

    private ActionItem findOwned(Long actionItemId, Long userId, Long workspaceId) {
        return actionItemRepository.findByIdAndUserIdAndWorkspaceId(actionItemId, userId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Action item not found"));
    }

    private ActionItemResponse toResponse(ActionItem actionItem) {
        boolean overdue = actionItem.getDueDate() != null
                && actionItem.getDueDate().isBefore(LocalDate.now())
                && actionItem.getStatus() != ActionStatus.COMPLETED
                && actionItem.getStatus() != ActionStatus.CANCELLED;

        return ActionItemResponse.builder()
                .id(actionItem.getId())
                .title(actionItem.getTitle())
                .type(actionItem.getType())
                .status(actionItem.getStatus())
                .priority(actionItem.getPriority())
                .dueDate(actionItem.getDueDate())
                .snoozedUntil(actionItem.getSnoozedUntil())
                .overdue(overdue)
                .entityType(actionItem.getEntityType())
                .entityId(actionItem.getEntityId())
                .notes(actionItem.getNotes())
                .completedAt(actionItem.getCompletedAt())
                .createdAt(actionItem.getCreatedAt())
                .updatedAt(actionItem.getUpdatedAt())
                .build();
    }
}
