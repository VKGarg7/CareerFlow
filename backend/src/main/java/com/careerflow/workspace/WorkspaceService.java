package com.careerflow.workspace;

import com.careerflow.audit.AuditAction;
import com.careerflow.audit.AuditLogService;
import com.careerflow.common.SecurityUtils;
import com.careerflow.common.SortHelper;
import com.careerflow.exception.DuplicateResourceException;
import com.careerflow.exception.ResourceNotFoundException;
import com.careerflow.user.User;
import com.careerflow.workspace.dto.WorkspaceRequest;
import com.careerflow.workspace.dto.WorkspaceResponse;
import com.careerflow.workspace.dto.WorkspaceUpdateRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;

@SuppressWarnings("null")
@Service
@RequiredArgsConstructor
public class WorkspaceService {

    private static final Set<String> SORTABLE_FIELDS =
            Set.of("name", "status", "createdAt", "updatedAt");

    private final WorkspaceRepository workspaceRepository;
    private final SecurityUtils securityUtils;
    private final AuditLogService auditLogService;

    public WorkspaceResponse addWorkspace(WorkspaceRequest request) {
        User user = securityUtils.getCurrentUser();
        if (workspaceRepository.existsByUserIdAndNameIgnoreCase(user.getId(), request.getName()))
            throw new DuplicateResourceException("Workspace '" + request.getName() + "' already exists");
        Workspace workspace = Workspace.builder()
                .user(user)
                .name(request.getName())
                .description(request.getDescription())
                .targetRoles(request.getTargetRoles())
                .preferredLocations(request.getPreferredLocations())
                .compensationMin(request.getCompensationMin())
                .compensationMax(request.getCompensationMax())
                .workMode(request.getWorkMode())
                .jobTypes(request.getJobTypes())
                .searchStartDate(request.getSearchStartDate())
                .goalApplicationsTarget(request.getGoalApplicationsTarget())
                .goalInterviewsTarget(request.getGoalInterviewsTarget())
                .goalOffersTarget(request.getGoalOffersTarget())
                .status(request.getStatus() != null ? request.getStatus() : WorkspaceStatus.ACTIVE)
                .build();
        workspace = workspaceRepository.save(workspace);
        auditLogService.log(user, AuditAction.WORKSPACE_CREATED, "Created workspace " + workspace.getName());
        return toResponse(workspace);
    }

    public List<WorkspaceResponse> getMyWorkspaces(Long id, String search, String sortBy, String order) {
        User user = securityUtils.getCurrentUser();
        if (id != null) {
            return List.of(toResponse(findOwned(id, user.getId())));
        }
        Sort sort = SortHelper.build(sortBy, order, SORTABLE_FIELDS);
        boolean hasSearch = search != null && !search.isBlank();
        List<Workspace> results = hasSearch
                ? workspaceRepository.findAllByUserIdAndNameContainingIgnoreCase(user.getId(), search.trim(), sort)
                : workspaceRepository.findAllByUserId(user.getId(), sort);
        return results.stream().map(this::toResponse).toList();
    }

    public WorkspaceResponse updateWorkspace(Long id, WorkspaceUpdateRequest request) {
        User user = securityUtils.getCurrentUser();
        Workspace workspace = findOwned(id, user.getId());

        if (request.getName() != null && !request.getName().isBlank()) {
            if (workspaceRepository.existsByUserIdAndNameIgnoreCaseAndIdNot(user.getId(), request.getName(), id))
                throw new DuplicateResourceException("Workspace '" + request.getName() + "' already exists");
            workspace.setName(request.getName());
        }
        if (request.getDescription() != null) workspace.setDescription(request.getDescription());
        if (request.getTargetRoles() != null) workspace.setTargetRoles(request.getTargetRoles());
        if (request.getPreferredLocations() != null) workspace.setPreferredLocations(request.getPreferredLocations());
        if (request.getCompensationMin() != null) workspace.setCompensationMin(request.getCompensationMin());
        if (request.getCompensationMax() != null) workspace.setCompensationMax(request.getCompensationMax());
        if (request.getWorkMode() != null) workspace.setWorkMode(request.getWorkMode());
        if (request.getJobTypes() != null) workspace.setJobTypes(request.getJobTypes());
        if (request.getSearchStartDate() != null) workspace.setSearchStartDate(request.getSearchStartDate());
        if (request.getGoalApplicationsTarget() != null) workspace.setGoalApplicationsTarget(request.getGoalApplicationsTarget());
        if (request.getGoalInterviewsTarget() != null) workspace.setGoalInterviewsTarget(request.getGoalInterviewsTarget());
        if (request.getGoalOffersTarget() != null) workspace.setGoalOffersTarget(request.getGoalOffersTarget());
        if (request.getStatus() != null) workspace.setStatus(request.getStatus());

        workspace = workspaceRepository.save(workspace);
        auditLogService.log(user, AuditAction.WORKSPACE_UPDATED, "Updated workspace " + workspace.getName());
        return toResponse(workspace);
    }

    public void deleteWorkspace(Long id) {
        User user = securityUtils.getCurrentUser();
        Workspace workspace = findOwned(id, user.getId());
        workspace.softDelete();
        workspaceRepository.save(workspace);
        auditLogService.log(user, AuditAction.WORKSPACE_DELETED, "Deleted workspace " + workspace.getName());
    }

    private Workspace findOwned(Long workspaceId, Long userId) {
        return workspaceRepository.findByIdAndUserId(workspaceId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));
    }

    private WorkspaceResponse toResponse(Workspace workspace) {
        return WorkspaceResponse.builder()
                .id(workspace.getId())
                .name(workspace.getName())
                .description(workspace.getDescription())
                .targetRoles(workspace.getTargetRoles())
                .preferredLocations(workspace.getPreferredLocations())
                .compensationMin(workspace.getCompensationMin())
                .compensationMax(workspace.getCompensationMax())
                .workMode(workspace.getWorkMode())
                .jobTypes(workspace.getJobTypes())
                .searchStartDate(workspace.getSearchStartDate())
                .goalApplicationsTarget(workspace.getGoalApplicationsTarget())
                .goalInterviewsTarget(workspace.getGoalInterviewsTarget())
                .goalOffersTarget(workspace.getGoalOffersTarget())
                .status(workspace.getStatus())
                .createdAt(workspace.getCreatedAt())
                .updatedAt(workspace.getUpdatedAt())
                .build();
    }
}
