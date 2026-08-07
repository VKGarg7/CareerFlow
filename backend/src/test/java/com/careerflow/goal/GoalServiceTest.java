package com.careerflow.goal;

import com.careerflow.application.ApplicationRepository;
import com.careerflow.audit.AuditLogService;
import com.careerflow.common.SecurityUtils;
import com.careerflow.common.WorkspaceAccessUtils;
import com.careerflow.company.CompanyRepository;
import com.careerflow.exception.BadRequestException;
import com.careerflow.exception.ResourceNotFoundException;
import com.careerflow.goal.dto.GoalRequest;
import com.careerflow.goal.dto.GoalResponse;
import com.careerflow.goal.dto.GoalUpdateRequest;
import com.careerflow.interview.InterviewRepository;
import com.careerflow.recruiter.RecruiterContactRepository;
import com.careerflow.referral.ReferralRequestRepository;
import com.careerflow.user.User;
import com.careerflow.workspace.Workspace;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link GoalService} using JUnit 5 + Mockito.
 * Dependencies are mocked so the service logic is verified in isolation,
 * without spinning up Spring context or a database.
 */
@SuppressWarnings("null")
@ExtendWith(MockitoExtension.class)
class GoalServiceTest {

    @Mock
    private GoalRepository goalRepository;
    @Mock
    private WorkspaceAccessUtils workspaceAccessUtils;
    @Mock
    private SecurityUtils securityUtils;
    @Mock
    private AuditLogService auditLogService;
    @Mock
    private ApplicationRepository applicationRepository;
    @Mock
    private RecruiterContactRepository recruiterContactRepository;
    @Mock
    private ReferralRequestRepository referralRequestRepository;
    @Mock
    private InterviewRepository interviewRepository;
    @Mock
    private CompanyRepository companyRepository;

    @InjectMocks
    private GoalService goalService;

    private User currentUser;
    private static final Long WORKSPACE_ID = 99L;
    private static final LocalDate START = LocalDate.of(2026, 1, 1);
    private static final LocalDate END = LocalDate.of(2026, 1, 31);

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

    private GoalRequest request(GoalMetricType metricType, int targetValue) {
        GoalRequest request = new GoalRequest();
        request.setMetricType(metricType);
        request.setTargetValue(targetValue);
        request.setStartDate(START);
        request.setEndDate(END);
        return request;
    }

    @Test
    void addGoal_savesAndReturnsResponse_withComputedProgress() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(workspaceAccessUtils.getOwnedWorkspace(WORKSPACE_ID, 1L)).thenReturn(workspace());
        when(goalRepository.save(any(Goal.class))).thenAnswer(invocation -> {
            Goal goal = invocation.getArgument(0);
            goal.setId(10L);
            return goal;
        });
        when(applicationRepository.countByUserIdAndWorkspaceIdAndApplicationDateBetween(1L, WORKSPACE_ID, START, END))
                .thenReturn(3L);

        GoalResponse response = goalService.addGoal(request(GoalMetricType.APPLICATIONS, 10), WORKSPACE_ID);

        assertThat(response.getId()).isEqualTo(10L);
        assertThat(response.getMetricType()).isEqualTo(GoalMetricType.APPLICATIONS);
        assertThat(response.getStatus()).isEqualTo(GoalStatus.ACTIVE);
        assertThat(response.getProgress()).isEqualTo(3L);
        verify(goalRepository).save(any(Goal.class));
        verify(auditLogService).log(eq(currentUser), any(), anyString());
    }

    @Test
    void addGoal_throwsBadRequestException_whenEndDateBeforeStartDate() {
        GoalRequest request = request(GoalMetricType.APPLICATIONS, 10);
        request.setStartDate(END);
        request.setEndDate(START);

        assertThatThrownBy(() -> goalService.addGoal(request, WORKSPACE_ID))
                .isInstanceOf(BadRequestException.class);

        verify(goalRepository, never()).save(any());
    }

    @Test
    void getMyGoals_marksGoalCompleted_whenProgressReachesTarget() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        Goal goal = Goal.builder()
                .user(currentUser)
                .workspace(workspace())
                .metricType(GoalMetricType.RECRUITER_OUTREACH)
                .targetValue(5)
                .startDate(START)
                .endDate(END)
                .status(GoalStatus.ACTIVE)
                .build();
        goal.setId(7L);
        when(goalRepository.findByIdAndUserIdAndWorkspaceId(7L, 1L, WORKSPACE_ID)).thenReturn(Optional.of(goal));
        when(recruiterContactRepository.countByUserIdAndWorkspaceIdAndCreatedAtBetween(1L, WORKSPACE_ID, START, END))
                .thenReturn(5L);
        when(goalRepository.save(any(Goal.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var page = goalService.getMyGoals(7L, null, "createdAt", "desc", 0, 10, WORKSPACE_ID);

        assertThat(page.getContent()).hasSize(1);
        assertThat(page.getContent().get(0).getStatus()).isEqualTo(GoalStatus.COMPLETED);
        assertThat(page.getContent().get(0).getProgress()).isEqualTo(5L);
        verify(goalRepository).save(argThat(g -> g.getStatus() == GoalStatus.COMPLETED));
    }

    @Test
    void updateGoal_throwsResourceNotFoundException_whenGoalNotOwnedByUser() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(goalRepository.findByIdAndUserIdAndWorkspaceId(99L, 1L, WORKSPACE_ID)).thenReturn(Optional.empty());

        GoalUpdateRequest request = new GoalUpdateRequest();

        assertThatThrownBy(() -> goalService.updateGoal(99L, request, WORKSPACE_ID))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void updateGoal_throwsBadRequestException_whenUpdatedEndDateBeforeStartDate() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        Goal goal = Goal.builder()
                .user(currentUser)
                .workspace(workspace())
                .metricType(GoalMetricType.APPLICATIONS)
                .targetValue(10)
                .startDate(START)
                .endDate(END)
                .status(GoalStatus.ACTIVE)
                .build();
        goal.setId(3L);
        when(goalRepository.findByIdAndUserIdAndWorkspaceId(3L, 1L, WORKSPACE_ID)).thenReturn(Optional.of(goal));

        GoalUpdateRequest request = new GoalUpdateRequest();
        request.setEndDate(START.minusDays(1));

        assertThatThrownBy(() -> goalService.updateGoal(3L, request, WORKSPACE_ID))
                .isInstanceOf(BadRequestException.class);

        verify(goalRepository, never()).save(any());
    }

    @Test
    void deleteGoal_softDeletesGoal() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        Goal goal = Goal.builder().user(currentUser).workspace(workspace())
                .metricType(GoalMetricType.APPLICATIONS).targetValue(10)
                .startDate(START).endDate(END).build();
        goal.setId(5L);
        when(goalRepository.findByIdAndUserIdAndWorkspaceId(5L, 1L, WORKSPACE_ID)).thenReturn(Optional.of(goal));
        when(goalRepository.save(any(Goal.class))).thenAnswer(invocation -> invocation.getArgument(0));

        goalService.deleteGoal(5L, WORKSPACE_ID);

        verify(goalRepository).save(argThat(g -> g.getDeletedAt() != null));
    }
}
