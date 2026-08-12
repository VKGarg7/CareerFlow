package com.careerflow.deadline;

import com.careerflow.actionitem.ActionableEntityType;
import com.careerflow.audit.AuditAction;
import com.careerflow.audit.AuditLogService;
import com.careerflow.common.PageResponse;
import com.careerflow.common.PaginationHelper;
import com.careerflow.common.SecurityUtils;
import com.careerflow.common.WorkspaceAccessUtils;
import com.careerflow.deadline.dto.DeadlineRequest;
import com.careerflow.deadline.dto.DeadlineResponse;
import com.careerflow.deadline.dto.DeadlineUpdateRequest;
import com.careerflow.exception.ResourceNotFoundException;
import com.careerflow.user.User;
import com.careerflow.workspace.Workspace;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class DeadlineService {

    private static final Set<String> SORTABLE_FIELDS = Set.of("title", "status", "dueAt", "createdAt", "updatedAt");

    private final DeadlineRepository deadlineRepository;
    private final WorkspaceAccessUtils workspaceAccessUtils;
    private final SecurityUtils securityUtils;
    private final AuditLogService auditLogService;

    public DeadlineResponse addDeadline(DeadlineRequest request, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        Workspace workspace = workspaceAccessUtils.getOwnedWorkspace(workspaceId, user.getId());

        Deadline deadline = Deadline.builder()
                .user(user)
                .workspace(workspace)
                .title(request.getTitle())
                .type(request.getType())
                .dueAt(request.getDueAt())
                .entityType(request.getEntityType())
                .entityId(request.getEntityId())
                .notes(request.getNotes())
                .build();

        deadline = deadlineRepository.save(deadline);
        auditLogService.log(user, AuditAction.DEADLINE_CREATED, "Added deadline: " + deadline.getTitle());
        return toResponse(deadline);
    }

    public PageResponse<DeadlineResponse> getMyDeadlines(
            Long id, DeadlineStatus status, String sortBy, String order, int page, int size, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        if (id != null) {
            return PageResponse.single(toResponse(findOwned(id, user.getId(), workspaceId)));
        }
        Pageable pageable = PaginationHelper.build(page, size, sortBy, order, SORTABLE_FIELDS);
        Page<Deadline> results = status != null
                ? deadlineRepository.findAllByUserIdAndWorkspaceIdAndStatus(user.getId(), workspaceId, status, pageable)
                : deadlineRepository.findAllByUserIdAndWorkspaceId(user.getId(), workspaceId, pageable);
        return PageResponse.of(results.map(this::toResponse));
    }

    public List<DeadlineResponse> getDeadlinesForEntity(ActionableEntityType entityType, Long entityId, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        return deadlineRepository
                .findAllByUserIdAndWorkspaceIdAndEntityTypeAndEntityId(user.getId(), workspaceId, entityType, entityId)
                .stream().map(this::toResponse).toList();
    }

    public List<DeadlineResponse> getUpcomingDeadlines(int withinDays, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime until = now.plusDays(Math.max(withinDays, 0));
        return deadlineRepository
                .findAllByUserIdAndWorkspaceIdAndStatusAndDueAtBetweenOrderByDueAtAsc(
                        user.getId(), workspaceId, DeadlineStatus.UPCOMING, now, until)
                .stream().map(this::toResponse).toList();
    }

    public DeadlineResponse updateDeadline(Long id, DeadlineUpdateRequest request, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        Deadline deadline = findOwned(id, user.getId(), workspaceId);

        if (request.getTitle() != null && !request.getTitle().isBlank()) deadline.setTitle(request.getTitle());
        if (request.getType() != null) deadline.setType(request.getType());
        if (request.getDueAt() != null) deadline.setDueAt(request.getDueAt());
        if (request.getNotes() != null) deadline.setNotes(request.getNotes());
        if (request.getStatus() != null) deadline.setStatus(request.getStatus());

        deadline = deadlineRepository.save(deadline);
        auditLogService.log(user, AuditAction.DEADLINE_UPDATED, "Updated deadline: " + deadline.getTitle());
        return toResponse(deadline);
    }

    public DeadlineResponse completeDeadline(Long id, Long workspaceId) {
        return transition(id, workspaceId, DeadlineStatus.COMPLETED, AuditAction.DEADLINE_COMPLETED);
    }

    public DeadlineResponse cancelDeadline(Long id, Long workspaceId) {
        return transition(id, workspaceId, DeadlineStatus.CANCELLED, AuditAction.DEADLINE_CANCELLED);
    }

    private DeadlineResponse transition(Long id, Long workspaceId, DeadlineStatus status, AuditAction auditAction) {
        User user = securityUtils.getCurrentUser();
        Deadline deadline = findOwned(id, user.getId(), workspaceId);
        deadline.setStatus(status);
        deadline = deadlineRepository.save(deadline);
        auditLogService.log(user, auditAction, "Deadline " + status.name().toLowerCase() + ": " + deadline.getTitle());
        return toResponse(deadline);
    }

    public void deleteDeadline(Long id, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        Deadline deadline = findOwned(id, user.getId(), workspaceId);
        deadline.softDelete();
        deadlineRepository.save(deadline);
        auditLogService.log(user, AuditAction.DEADLINE_DELETED, "Deleted deadline: " + deadline.getTitle());
    }

    private Deadline findOwned(Long deadlineId, Long userId, Long workspaceId) {
        return deadlineRepository.findByIdAndUserIdAndWorkspaceId(deadlineId, userId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Deadline not found"));
    }

    private DeadlineResponse toResponse(Deadline deadline) {
        boolean missed = deadline.getStatus() == DeadlineStatus.UPCOMING && deadline.getDueAt().isBefore(LocalDateTime.now());
        return DeadlineResponse.builder()
                .id(deadline.getId())
                .title(deadline.getTitle())
                .type(deadline.getType())
                .status(deadline.getStatus())
                .dueAt(deadline.getDueAt())
                .missed(missed)
                .entityType(deadline.getEntityType())
                .entityId(deadline.getEntityId())
                .notes(deadline.getNotes())
                .createdAt(deadline.getCreatedAt())
                .updatedAt(deadline.getUpdatedAt())
                .build();
    }
}
