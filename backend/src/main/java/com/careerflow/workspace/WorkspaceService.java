package com.careerflow.workspace;

import com.careerflow.audit.AuditAction;
import com.careerflow.audit.AuditLogService;
import com.careerflow.common.PageResponse;
import com.careerflow.common.PaginationHelper;
import com.careerflow.common.SecurityUtils;
import com.careerflow.exception.ConflictException;
import com.careerflow.exception.DuplicateResourceException;
import com.careerflow.exception.ResourceNotFoundException;
import com.careerflow.user.User;
import com.careerflow.workspace.dto.WorkspaceRequest;
import com.careerflow.workspace.dto.WorkspaceResponse;
import com.careerflow.workspace.dto.WorkspaceUpdateRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

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
                .staleApplicationThresholdDays(request.getStaleApplicationThresholdDays() != null
                        ? request.getStaleApplicationThresholdDays() : 14)
                .build();
        workspace = workspaceRepository.save(workspace);
        auditLogService.log(user, AuditAction.WORKSPACE_CREATED, "Created workspace " + workspace.getName());
        return toResponse(workspace);
    }

    public PageResponse<WorkspaceResponse> getMyWorkspaces(
            Long id, String search, WorkspaceStatus status, String sortBy, String order, int page, int size) {
        User user = securityUtils.getCurrentUser();
        if (id != null) {
            WorkspaceResponse single = toResponse(findOwned(id, user.getId()));
            return PageResponse.single(single);
        }
        Pageable pageable = PaginationHelper.build(page, size, sortBy, order, SORTABLE_FIELDS);
        boolean hasSearch = search != null && !search.isBlank();
        Page<Workspace> results;
        if (status != null && hasSearch) {
            results = workspaceRepository.findAllByUserIdAndStatusAndNameContainingIgnoreCase(user.getId(), status, search.trim(), pageable);
        } else if (status != null) {
            results = workspaceRepository.findAllByUserIdAndStatus(user.getId(), status, pageable);
        } else if (hasSearch) {
            results = workspaceRepository.findAllByUserIdAndNameContainingIgnoreCase(user.getId(), search.trim(), pageable);
        } else {
            results = workspaceRepository.findAllByUserId(user.getId(), pageable);
        }
        return PageResponse.of(results.map(this::toResponse));
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
        if (request.getStaleApplicationThresholdDays() != null)
            workspace.setStaleApplicationThresholdDays(request.getStaleApplicationThresholdDays());

        workspace = workspaceRepository.save(workspace);
        auditLogService.log(user, AuditAction.WORKSPACE_UPDATED, "Updated workspace " + workspace.getName());
        return toResponse(workspace);
    }

    public void deleteWorkspace(Long id) {
        User user = securityUtils.getCurrentUser();
        Workspace workspace = findOwned(id, user.getId());
        if (Boolean.TRUE.equals(workspace.getIsDefault()))
            throw new ConflictException("The default workspace cannot be deleted.");
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
                .isDefault(workspace.getIsDefault())
                .staleApplicationThresholdDays(workspace.getStaleApplicationThresholdDays())
                .createdAt(workspace.getCreatedAt())
                .updatedAt(workspace.getUpdatedAt())
                .build();
    }
}
