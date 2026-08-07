package com.careerflow.rolefit;

import com.careerflow.audit.AuditAction;
import com.careerflow.audit.AuditLogService;
import com.careerflow.common.SecurityUtils;
import com.careerflow.common.WorkspaceAccessUtils;
import com.careerflow.company.Company;
import com.careerflow.exception.ConflictException;
import com.careerflow.exception.ResourceNotFoundException;
import com.careerflow.opportunity.Opportunity;
import com.careerflow.opportunity.OpportunityRepository;
import com.careerflow.opportunity.OpportunityStatus;
import com.careerflow.rolefit.dto.RoleFitEvaluationRequest;
import com.careerflow.rolefit.dto.RoleFitEvaluationResponse;
import com.careerflow.rolefit.dto.RoleFitEvaluationUpdateRequest;
import com.careerflow.rolefit.dto.RoleFitOverrideRequest;
import com.careerflow.user.User;
import com.careerflow.workspace.Workspace;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@SuppressWarnings("null")
@ExtendWith(MockitoExtension.class)
class RoleFitEvaluationServiceTest {

    @Mock
    private RoleFitEvaluationRepository roleFitEvaluationRepository;
    @Mock
    private OpportunityRepository opportunityRepository;
    @Mock
    private WorkspaceAccessUtils workspaceAccessUtils;
    @Mock
    private SecurityUtils securityUtils;
    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private RoleFitEvaluationService roleFitEvaluationService;

    private User currentUser;
    private static final Long WORKSPACE_ID = 99L;
    private static final Long OPPORTUNITY_ID = 5L;

    @BeforeEach
    void setUp() {
        currentUser = new User();
        currentUser.setId(1L);
    }

    private Workspace workspace() {
        Workspace workspace = new Workspace();
        workspace.setId(WORKSPACE_ID);
        return workspace;
    }

    private Opportunity opportunity() {
        Company company = new Company();
        company.setId(10L);
        company.setName("Acme Corp");
        Opportunity opportunity = Opportunity.builder()
                .user(currentUser).workspace(workspace()).company(company)
                .roleTitle("Backend Engineer").status(OpportunityStatus.SAVED)
                .build();
        opportunity.setId(OPPORTUNITY_ID);
        return opportunity;
    }

    private RoleFitEvaluationRequest request() {
        RoleFitEvaluationRequest request = new RoleFitEvaluationRequest();
        request.setOpportunityId(OPPORTUNITY_ID);
        request.setRequiredSkills("Java, Spring Boot");
        request.setUserSkills("Java");
        request.setLocationFit(FitRating.GOOD);
        return request;
    }

    private RoleFitEvaluation evaluation(Long id) {
        RoleFitEvaluation evaluation = RoleFitEvaluation.builder()
                .user(currentUser).workspace(workspace()).opportunity(opportunity())
                .requiredSkills("Java, Spring Boot").userSkills("Java")
                .computedFitScore(50).missingSkills("Spring Boot")
                .build();
        evaluation.setId(id);
        return evaluation;
    }

    @Test
    void addEvaluation_savesAndReturnsResponse_withComputedScore() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(opportunityRepository.findByIdAndUserIdAndWorkspaceId(OPPORTUNITY_ID, 1L, WORKSPACE_ID))
                .thenReturn(Optional.of(opportunity()));
        when(workspaceAccessUtils.getOwnedWorkspace(WORKSPACE_ID, 1L)).thenReturn(workspace());
        when(roleFitEvaluationRepository.existsByOpportunityIdAndUserIdAndWorkspaceId(OPPORTUNITY_ID, 1L, WORKSPACE_ID))
                .thenReturn(false);
        when(roleFitEvaluationRepository.save(any(RoleFitEvaluation.class))).thenAnswer(invocation -> {
            RoleFitEvaluation evaluation = invocation.getArgument(0);
            evaluation.setId(20L);
            return evaluation;
        });

        RoleFitEvaluationResponse response = roleFitEvaluationService.addEvaluation(request(), WORKSPACE_ID);

        assertThat(response.getId()).isEqualTo(20L);
        assertThat(response.getComputedFitScore()).isNotNull();
        assertThat(response.getMissingSkills()).isEqualTo("Spring Boot");
        assertThat(response.getEffectiveFitScore()).isEqualTo(response.getComputedFitScore());
        verify(auditLogService).log(eq(currentUser), eq(AuditAction.ROLE_FIT_EVALUATION_CREATED), anyString());
    }

    @Test
    void addEvaluation_throwsConflictException_whenEvaluationAlreadyExists() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(opportunityRepository.findByIdAndUserIdAndWorkspaceId(OPPORTUNITY_ID, 1L, WORKSPACE_ID))
                .thenReturn(Optional.of(opportunity()));
        when(workspaceAccessUtils.getOwnedWorkspace(WORKSPACE_ID, 1L)).thenReturn(workspace());
        when(roleFitEvaluationRepository.existsByOpportunityIdAndUserIdAndWorkspaceId(OPPORTUNITY_ID, 1L, WORKSPACE_ID))
                .thenReturn(true);

        assertThatThrownBy(() -> roleFitEvaluationService.addEvaluation(request(), WORKSPACE_ID))
                .isInstanceOf(ConflictException.class);

        verify(roleFitEvaluationRepository, never()).save(any());
    }

    @Test
    void addEvaluation_throwsResourceNotFoundException_whenOpportunityNotOwned() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(opportunityRepository.findByIdAndUserIdAndWorkspaceId(OPPORTUNITY_ID, 1L, WORKSPACE_ID))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> roleFitEvaluationService.addEvaluation(request(), WORKSPACE_ID))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void updateEvaluation_recomputesScore_whenInputsChange() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        RoleFitEvaluation existing = evaluation(7L);
        when(roleFitEvaluationRepository.findByIdAndUserIdAndWorkspaceId(7L, 1L, WORKSPACE_ID))
                .thenReturn(Optional.of(existing));
        when(roleFitEvaluationRepository.save(any(RoleFitEvaluation.class))).thenAnswer(invocation -> invocation.getArgument(0));

        RoleFitEvaluationUpdateRequest update = new RoleFitEvaluationUpdateRequest();
        update.setUserSkills("Java, Spring Boot");

        RoleFitEvaluationResponse response = roleFitEvaluationService.updateEvaluation(7L, update, WORKSPACE_ID);

        assertThat(response.getMissingSkills()).isEmpty();
        assertThat(response.getComputedFitScore()).isEqualTo(100);
        verify(auditLogService).log(eq(currentUser), eq(AuditAction.ROLE_FIT_EVALUATION_UPDATED), anyString());
    }

    @Test
    void overrideEvaluation_setsOverrideFields_andEffectiveScoreReflectsOverride() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        RoleFitEvaluation existing = evaluation(8L);
        when(roleFitEvaluationRepository.findByIdAndUserIdAndWorkspaceId(8L, 1L, WORKSPACE_ID))
                .thenReturn(Optional.of(existing));
        when(roleFitEvaluationRepository.save(any(RoleFitEvaluation.class))).thenAnswer(invocation -> invocation.getArgument(0));

        RoleFitOverrideRequest override = new RoleFitOverrideRequest();
        override.setOverrideFitScore(90);
        override.setOverrideFitTier(FitTier.STRONG_FIT);
        override.setDecisionNote("Willing to upskill on Spring Boot quickly.");

        RoleFitEvaluationResponse response = roleFitEvaluationService.overrideEvaluation(8L, override, WORKSPACE_ID);

        assertThat(response.getEffectiveFitScore()).isEqualTo(90);
        assertThat(response.getEffectiveFitTier()).isEqualTo(FitTier.STRONG_FIT);
        assertThat(response.getComputedFitScore()).isEqualTo(50);
        assertThat(response.getDecisionNote()).isEqualTo("Willing to upskill on Spring Boot quickly.");
        verify(auditLogService).log(eq(currentUser), eq(AuditAction.ROLE_FIT_EVALUATION_OVERRIDDEN), anyString());
    }

    @Test
    void deleteEvaluation_softDeletesEvaluation() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        RoleFitEvaluation existing = evaluation(9L);
        when(roleFitEvaluationRepository.findByIdAndUserIdAndWorkspaceId(9L, 1L, WORKSPACE_ID))
                .thenReturn(Optional.of(existing));
        when(roleFitEvaluationRepository.save(any(RoleFitEvaluation.class))).thenAnswer(invocation -> invocation.getArgument(0));

        roleFitEvaluationService.deleteEvaluation(9L, WORKSPACE_ID);

        verify(roleFitEvaluationRepository).save(argThat(e -> e.getDeletedAt() != null));
    }
}
