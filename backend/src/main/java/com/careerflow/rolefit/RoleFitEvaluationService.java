package com.careerflow.rolefit;

import com.careerflow.audit.AuditAction;
import com.careerflow.audit.AuditLogService;
import com.careerflow.common.SecurityUtils;
import com.careerflow.common.WorkspaceAccessUtils;
import com.careerflow.exception.ConflictException;
import com.careerflow.exception.ResourceNotFoundException;
import com.careerflow.opportunity.Opportunity;
import com.careerflow.opportunity.OpportunityRepository;
import com.careerflow.rolefit.dto.RoleFitEvaluationRequest;
import com.careerflow.rolefit.dto.RoleFitEvaluationResponse;
import com.careerflow.rolefit.dto.RoleFitEvaluationUpdateRequest;
import com.careerflow.rolefit.dto.RoleFitOverrideRequest;
import com.careerflow.user.User;
import com.careerflow.workspace.Workspace;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RoleFitEvaluationService {

    private final RoleFitEvaluationRepository roleFitEvaluationRepository;
    private final OpportunityRepository opportunityRepository;
    private final WorkspaceAccessUtils workspaceAccessUtils;
    private final SecurityUtils securityUtils;
    private final AuditLogService auditLogService;

    public RoleFitEvaluationResponse addEvaluation(RoleFitEvaluationRequest request, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        Opportunity opportunity = findOwnedOpportunity(request.getOpportunityId(), user.getId(), workspaceId);
        Workspace workspace = workspaceAccessUtils.getOwnedWorkspace(workspaceId, user.getId());

        if (roleFitEvaluationRepository.existsByOpportunityIdAndUserIdAndWorkspaceId(opportunity.getId(), user.getId(), workspaceId))
            throw new ConflictException("A fit evaluation already exists for this opportunity");

        RoleFitEvaluation evaluation = RoleFitEvaluation.builder()
                .user(user)
                .workspace(workspace)
                .opportunity(opportunity)
                .requiredSkills(request.getRequiredSkills())
                .preferredSkills(request.getPreferredSkills())
                .userSkills(request.getUserSkills())
                .requiredExperienceYears(request.getRequiredExperienceYears())
                .userExperienceYears(request.getUserExperienceYears())
                .locationFit(request.getLocationFit())
                .compensationFit(request.getCompensationFit())
                .riskNotes(request.getRiskNotes())
                .confidenceNotes(request.getConfidenceNotes())
                .build();
        applyComputedScore(evaluation);

        evaluation = roleFitEvaluationRepository.save(evaluation);
        auditLogService.log(user, AuditAction.ROLE_FIT_EVALUATION_CREATED, "Evaluated fit for " + describe(evaluation));
        return toResponse(evaluation);
    }

    public RoleFitEvaluationResponse getEvaluation(Long id, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        return toResponse(findOwned(id, user.getId(), workspaceId));
    }

    public RoleFitEvaluationResponse getEvaluationForOpportunity(Long opportunityId, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        RoleFitEvaluation evaluation = roleFitEvaluationRepository
                .findByOpportunityIdAndUserIdAndWorkspaceId(opportunityId, user.getId(), workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Fit evaluation not found"));
        return toResponse(evaluation);
    }

    public RoleFitEvaluationResponse updateEvaluation(Long id, RoleFitEvaluationUpdateRequest request, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        RoleFitEvaluation evaluation = findOwned(id, user.getId(), workspaceId);

        if (request.getRequiredSkills() != null) evaluation.setRequiredSkills(request.getRequiredSkills());
        if (request.getPreferredSkills() != null) evaluation.setPreferredSkills(request.getPreferredSkills());
        if (request.getUserSkills() != null) evaluation.setUserSkills(request.getUserSkills());
        if (request.getRequiredExperienceYears() != null) evaluation.setRequiredExperienceYears(request.getRequiredExperienceYears());
        if (request.getUserExperienceYears() != null) evaluation.setUserExperienceYears(request.getUserExperienceYears());
        if (request.getLocationFit() != null) evaluation.setLocationFit(request.getLocationFit());
        if (request.getCompensationFit() != null) evaluation.setCompensationFit(request.getCompensationFit());
        if (request.getRiskNotes() != null) evaluation.setRiskNotes(request.getRiskNotes());
        if (request.getConfidenceNotes() != null) evaluation.setConfidenceNotes(request.getConfidenceNotes());
        applyComputedScore(evaluation);

        evaluation = roleFitEvaluationRepository.save(evaluation);
        auditLogService.log(user, AuditAction.ROLE_FIT_EVALUATION_UPDATED, "Updated fit evaluation for " + describe(evaluation));
        return toResponse(evaluation);
    }

    public RoleFitEvaluationResponse overrideEvaluation(Long id, RoleFitOverrideRequest request, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        RoleFitEvaluation evaluation = findOwned(id, user.getId(), workspaceId);

        evaluation.setOverrideFitScore(request.getOverrideFitScore());
        evaluation.setOverrideFitTier(request.getOverrideFitTier());
        evaluation.setDecisionNote(request.getDecisionNote());

        evaluation = roleFitEvaluationRepository.save(evaluation);
        auditLogService.log(user, AuditAction.ROLE_FIT_EVALUATION_OVERRIDDEN, "Overrode fit conclusion for " + describe(evaluation));
        return toResponse(evaluation);
    }

    public void deleteEvaluation(Long id, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        RoleFitEvaluation evaluation = findOwned(id, user.getId(), workspaceId);
        evaluation.softDelete();
        roleFitEvaluationRepository.save(evaluation);
        auditLogService.log(user, AuditAction.ROLE_FIT_EVALUATION_DELETED, "Deleted fit evaluation for " + describe(evaluation));
    }

    private void applyComputedScore(RoleFitEvaluation evaluation) {
        FitScoreCalculator.Result result = FitScoreCalculator.calculate(
                evaluation.getRequiredSkills(), evaluation.getPreferredSkills(), evaluation.getUserSkills(),
                evaluation.getRequiredExperienceYears(), evaluation.getUserExperienceYears(),
                evaluation.getLocationFit(), evaluation.getCompensationFit());
        evaluation.setComputedFitScore(result.score());
        evaluation.setMissingSkills(result.missingSkills());
        evaluation.setScoreBreakdown(result.breakdown());
    }

    private RoleFitEvaluation findOwned(Long id, Long userId, Long workspaceId) {
        return roleFitEvaluationRepository.findByIdAndUserIdAndWorkspaceId(id, userId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Fit evaluation not found"));
    }

    private Opportunity findOwnedOpportunity(Long opportunityId, Long userId, Long workspaceId) {
        return opportunityRepository.findByIdAndUserIdAndWorkspaceId(opportunityId, userId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Opportunity not found"));
    }

    private String describe(RoleFitEvaluation evaluation) {
        return evaluation.getOpportunity().getRoleTitle() + " at " + evaluation.getOpportunity().getCompany().getName();
    }

    private RoleFitEvaluationResponse toResponse(RoleFitEvaluation evaluation) {
        int effectiveScore = evaluation.effectiveFitScore();
        FitTier effectiveTier = evaluation.getOverrideFitTier() != null
                ? evaluation.getOverrideFitTier()
                : FitScoreCalculator.tierFor(effectiveScore);

        return RoleFitEvaluationResponse.builder()
                .id(evaluation.getId())
                .opportunityId(evaluation.getOpportunity().getId())
                .opportunityRoleTitle(evaluation.getOpportunity().getRoleTitle())
                .requiredSkills(evaluation.getRequiredSkills())
                .preferredSkills(evaluation.getPreferredSkills())
                .userSkills(evaluation.getUserSkills())
                .requiredExperienceYears(evaluation.getRequiredExperienceYears())
                .userExperienceYears(evaluation.getUserExperienceYears())
                .locationFit(evaluation.getLocationFit())
                .compensationFit(evaluation.getCompensationFit())
                .riskNotes(evaluation.getRiskNotes())
                .confidenceNotes(evaluation.getConfidenceNotes())
                .computedFitScore(evaluation.getComputedFitScore())
                .computedFitTier(evaluation.getComputedFitScore() != null ? FitScoreCalculator.tierFor(evaluation.getComputedFitScore()) : null)
                .missingSkills(evaluation.getMissingSkills())
                .scoreBreakdown(evaluation.getScoreBreakdown())
                .overrideFitScore(evaluation.getOverrideFitScore())
                .overrideFitTier(evaluation.getOverrideFitTier())
                .decisionNote(evaluation.getDecisionNote())
                .effectiveFitScore(effectiveScore)
                .effectiveFitTier(effectiveTier)
                .createdAt(evaluation.getCreatedAt())
                .updatedAt(evaluation.getUpdatedAt())
                .build();
    }
}
