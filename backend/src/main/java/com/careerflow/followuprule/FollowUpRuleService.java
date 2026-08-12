package com.careerflow.followuprule;

import com.careerflow.actionitem.ActionItem;
import com.careerflow.actionitem.ActionItemRepository;
import com.careerflow.actionitem.ActionPriority;
import com.careerflow.actionitem.ActionStatus;
import com.careerflow.actionitem.ActionableEntityType;
import com.careerflow.audit.AuditAction;
import com.careerflow.audit.AuditLogService;
import com.careerflow.common.PageResponse;
import com.careerflow.common.PaginationHelper;
import com.careerflow.common.SecurityUtils;
import com.careerflow.common.WorkspaceAccessUtils;
import com.careerflow.exception.ResourceNotFoundException;
import com.careerflow.followuprule.dto.FollowUpRuleRequest;
import com.careerflow.followuprule.dto.FollowUpRuleResponse;
import com.careerflow.followuprule.dto.FollowUpRuleUpdateRequest;
import com.careerflow.user.User;
import com.careerflow.workspace.Workspace;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class FollowUpRuleService {

    private static final Set<String> SORTABLE_FIELDS = Set.of("name", "triggerEvent", "createdAt", "updatedAt");

    private final FollowUpRuleRepository followUpRuleRepository;
    private final FollowUpRuleExecutionRepository executionRepository;
    private final ActionItemRepository actionItemRepository;
    private final WorkspaceAccessUtils workspaceAccessUtils;
    private final SecurityUtils securityUtils;
    private final AuditLogService auditLogService;

    public FollowUpRuleResponse addRule(FollowUpRuleRequest request, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        Workspace workspace = workspaceAccessUtils.getOwnedWorkspace(workspaceId, user.getId());

        FollowUpRule rule = FollowUpRule.builder()
                .user(user)
                .workspace(workspace)
                .name(request.getName())
                .triggerEvent(request.getTriggerEvent())
                .delayDays(request.getDelayDays() != null ? request.getDelayDays() : 0)
                .actionType(request.getActionType())
                .actionTitle(request.getActionTitle())
                .enabled(request.getEnabled() == null || request.getEnabled())
                .build();

        rule = followUpRuleRepository.save(rule);
        auditLogService.log(user, AuditAction.FOLLOW_UP_RULE_CREATED, "Created follow-up rule: " + rule.getName());
        return toResponse(rule);
    }

    public PageResponse<FollowUpRuleResponse> getMyRules(String sortBy, String order, int page, int size, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        Pageable pageable = PaginationHelper.build(page, size, sortBy, order, SORTABLE_FIELDS);
        Page<FollowUpRule> results = followUpRuleRepository.findAllByUserIdAndWorkspaceId(user.getId(), workspaceId, pageable);
        return PageResponse.of(results.map(this::toResponse));
    }

    public FollowUpRuleResponse updateRule(Long id, FollowUpRuleUpdateRequest request, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        FollowUpRule rule = findOwned(id, user.getId(), workspaceId);

        if (request.getName() != null && !request.getName().isBlank()) rule.setName(request.getName());
        if (request.getTriggerEvent() != null) rule.setTriggerEvent(request.getTriggerEvent());
        if (request.getDelayDays() != null) rule.setDelayDays(request.getDelayDays());
        if (request.getActionType() != null) rule.setActionType(request.getActionType());
        if (request.getActionTitle() != null && !request.getActionTitle().isBlank()) rule.setActionTitle(request.getActionTitle());
        if (request.getEnabled() != null) rule.setEnabled(request.getEnabled());

        rule = followUpRuleRepository.save(rule);
        auditLogService.log(user, AuditAction.FOLLOW_UP_RULE_UPDATED, "Updated follow-up rule: " + rule.getName());
        return toResponse(rule);
    }

    public void deleteRule(Long id, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        FollowUpRule rule = findOwned(id, user.getId(), workspaceId);
        rule.softDelete();
        followUpRuleRepository.save(rule);
        auditLogService.log(user, AuditAction.FOLLOW_UP_RULE_DELETED, "Deleted follow-up rule: " + rule.getName());
    }

    private FollowUpRule findOwned(Long id, Long userId, Long workspaceId) {
        return followUpRuleRepository.findByIdAndUserIdAndWorkspaceId(id, userId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Follow-up rule not found"));
    }

    private FollowUpRuleResponse toResponse(FollowUpRule rule) {
        return FollowUpRuleResponse.builder()
                .id(rule.getId())
                .name(rule.getName())
                .triggerEvent(rule.getTriggerEvent())
                .delayDays(rule.getDelayDays())
                .actionType(rule.getActionType())
                .actionTitle(rule.getActionTitle())
                .enabled(rule.isEnabled())
                .createdAt(rule.getCreatedAt())
                .updatedAt(rule.getUpdatedAt())
                .build();
    }

    @Transactional
    public void onEvent(FollowUpTriggerEvent event, User user, Workspace workspace,
                         ActionableEntityType triggerEntityType, Long triggerEntityId, String entityLabel) {
        for (FollowUpRule rule : followUpRuleRepository.findAllByWorkspaceIdAndTriggerEventAndEnabledTrue(workspace.getId(), event)) {
            try {
                ActionItem created = ActionItem.builder()
                        .user(user)
                        .workspace(workspace)
                        .title(rule.getActionTitle().replace("{entity}", entityLabel != null ? entityLabel : ""))
                        .type(rule.getActionType())
                        .status(ActionStatus.OPEN)
                        .priority(ActionPriority.MEDIUM)
                        .dueDate(LocalDate.now().plusDays(rule.getDelayDays()))
                        .entityType(triggerEntityType)
                        .entityId(triggerEntityId)
                        .sourceRuleId(rule.getId())
                        .build();
                created = actionItemRepository.save(created);

                executionRepository.save(FollowUpRuleExecution.builder()
                        .ruleId(rule.getId())
                        .triggerEntityType(triggerEntityType)
                        .triggerEntityId(triggerEntityId)
                        .createdActionItemId(created.getId())
                        .build());

                auditLogService.log(user, AuditAction.FOLLOW_UP_RULE_TRIGGERED,
                        "Rule '" + rule.getName() + "' created action item: " + created.getTitle());
            } catch (DataIntegrityViolationException alreadyExecuted) {
                // Unique constraint hit: this rule already fired for this exact trigger entity — skip silently.
            }
        }
    }
}
