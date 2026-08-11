package com.careerflow.goal;

import com.careerflow.application.ApplicationRepository;
import com.careerflow.audit.AuditAction;
import com.careerflow.audit.AuditLogService;
import com.careerflow.common.PageResponse;
import com.careerflow.common.PaginationHelper;
import com.careerflow.common.SecurityUtils;
import com.careerflow.common.WorkspaceAccessUtils;
import com.careerflow.company.CompanyRepository;
import com.careerflow.exception.BadRequestException;
import com.careerflow.exception.ResourceNotFoundException;
import com.careerflow.goal.dto.GoalRequest;
import com.careerflow.goal.dto.GoalResponse;
import com.careerflow.goal.dto.GoalUpdateRequest;
import com.careerflow.interview.InterviewRepository;
import com.careerflow.contact.ContactRepository;
import com.careerflow.referral.ReferralRequestRepository;
import com.careerflow.user.User;
import com.careerflow.workspace.Workspace;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.Set;

@Service
@RequiredArgsConstructor
public class GoalService {

    private static final Set<String> SORTABLE_FIELDS =
            Set.of("startDate", "endDate", "targetValue", "status", "createdAt", "updatedAt");

    private final GoalRepository goalRepository;
    private final WorkspaceAccessUtils workspaceAccessUtils;
    private final SecurityUtils securityUtils;
    private final AuditLogService auditLogService;
    private final ApplicationRepository applicationRepository;
    private final ContactRepository contactRepository;
    private final ReferralRequestRepository referralRequestRepository;
    private final InterviewRepository interviewRepository;
    private final CompanyRepository companyRepository;

    public GoalResponse addGoal(GoalRequest request, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        if (request.getEndDate().isBefore(request.getStartDate()))
            throw new BadRequestException("End date must not be before start date");
        Workspace workspace = workspaceAccessUtils.getOwnedWorkspace(workspaceId, user.getId());
        Goal goal = Goal.builder()
                .user(user)
                .workspace(workspace)
                .metricType(request.getMetricType())
                .targetValue(request.getTargetValue())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .status(request.getStatus() != null ? request.getStatus() : GoalStatus.ACTIVE)
                .build();
        goal = goalRepository.save(goal);
        auditLogService.log(user, AuditAction.GOAL_CREATED, "Added goal for " + goal.getMetricType());
        return toResponse(goal);
    }

    public PageResponse<GoalResponse> getMyGoals(
            Long id, GoalStatus status, String sortBy, String order, int page, int size, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        if (id != null) {
            GoalResponse single = toResponse(findOwned(id, user.getId(), workspaceId));
            return PageResponse.single(single);
        }
        Pageable pageable = PaginationHelper.build(page, size, sortBy, order, SORTABLE_FIELDS);
        Page<Goal> results = status != null
                ? goalRepository.findAllByUserIdAndWorkspaceIdAndStatus(user.getId(), workspaceId, status, pageable)
                : goalRepository.findAllByUserIdAndWorkspaceId(user.getId(), workspaceId, pageable);
        return PageResponse.of(results.map(this::toResponse));
    }

    public GoalResponse updateGoal(Long id, GoalUpdateRequest request, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        Goal goal = findOwned(id, user.getId(), workspaceId);

        if (request.getMetricType() != null) goal.setMetricType(request.getMetricType());
        if (request.getTargetValue() != null) goal.setTargetValue(request.getTargetValue());
        if (request.getStartDate() != null) goal.setStartDate(request.getStartDate());
        if (request.getEndDate() != null) goal.setEndDate(request.getEndDate());
        if (request.getStatus() != null) goal.setStatus(request.getStatus());

        if (goal.getEndDate().isBefore(goal.getStartDate()))
            throw new BadRequestException("End date must not be before start date");

        goal = goalRepository.save(goal);
        auditLogService.log(user, AuditAction.GOAL_UPDATED, "Updated goal for " + goal.getMetricType());
        return toResponse(goal);
    }

    public void deleteGoal(Long id, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        Goal goal = findOwned(id, user.getId(), workspaceId);
        goal.softDelete();
        goalRepository.save(goal);
        auditLogService.log(user, AuditAction.GOAL_DELETED, "Deleted goal for " + goal.getMetricType());
    }

    private Goal findOwned(Long goalId, Long userId, Long workspaceId) {
        return goalRepository.findByIdAndUserIdAndWorkspaceId(goalId, userId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Goal not found"));
    }

    private long computeProgress(Goal goal) {
        Long userId = goal.getUser().getId();
        Long workspaceId = goal.getWorkspace().getId();
        return switch (goal.getMetricType()) {
            case APPLICATIONS -> applicationRepository.countByUserIdAndWorkspaceIdAndApplicationDateBetween(
                    userId, workspaceId, goal.getStartDate(), goal.getEndDate());
            case RECRUITER_OUTREACH -> contactRepository.countByUserIdAndWorkspaceIdAndCreatedAtBetween(
                    userId, workspaceId, goal.getStartDate(), goal.getEndDate());
            case REFERRALS -> referralRequestRepository.countByUserIdAndWorkspaceIdAndCreatedAtBetween(
                    userId, workspaceId, goal.getStartDate(), goal.getEndDate());
            case INTERVIEWS -> interviewRepository.countByUserIdAndWorkspaceIdAndScheduledAtBetween(
                    userId, workspaceId, goal.getStartDate(), goal.getEndDate());
            case TARGET_COMPANIES -> companyRepository.countByUserIdAndWorkspaceIdAndCreatedAtBetween(
                    userId, workspaceId, goal.getStartDate(), goal.getEndDate());
        };
    }

    private GoalResponse toResponse(Goal goal) {
        long progress = computeProgress(goal);
        if (goal.getStatus() == GoalStatus.ACTIVE && progress >= goal.getTargetValue()) {
            goal.setStatus(GoalStatus.COMPLETED);
            goalRepository.save(goal);
        }
        return GoalResponse.builder()
                .id(goal.getId())
                .metricType(goal.getMetricType())
                .targetValue(goal.getTargetValue())
                .startDate(goal.getStartDate())
                .endDate(goal.getEndDate())
                .status(goal.getStatus())
                .progress(progress)
                .createdAt(goal.getCreatedAt())
                .updatedAt(goal.getUpdatedAt())
                .build();
    }
}
