package com.careerflow.interview;

import com.careerflow.application.ApplicationRepository;
import com.careerflow.application.JobApplication;
import com.careerflow.audit.AuditLogService;
import com.careerflow.common.SecurityUtils;
import com.careerflow.company.Company;
import com.careerflow.exception.ResourceNotFoundException;
import com.careerflow.interview.dto.InterviewRequest;
import com.careerflow.interview.dto.InterviewResponse;
import com.careerflow.interview.dto.InterviewUpdateRequest;
import com.careerflow.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@SuppressWarnings("null")
@ExtendWith(MockitoExtension.class)
class InterviewServiceTest {

    @Mock
    private InterviewRepository interviewRepository;
    @Mock
    private ApplicationRepository applicationRepository;
    @Mock
    private SecurityUtils securityUtils;
    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private InterviewService interviewService;

    private User currentUser;
    private JobApplication application;

    @BeforeEach
    void setUp() {
        currentUser = new User();
        currentUser.setId(1L);

        Company company = Company.builder().user(currentUser).name("Acme").build();
        company.setId(100L);

        application = JobApplication.builder().user(currentUser).company(company).role("Backend Engineer").build();
        application.setId(50L);
    }

    @Test
    void create_savesInterview_withDefaultOutcome_whenOutcomeNotProvided() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(applicationRepository.findByIdAndUserId(50L, 1L)).thenReturn(Optional.of(application));
        when(interviewRepository.save(any(Interview.class))).thenAnswer(invocation -> {
            Interview interview = invocation.getArgument(0);
            interview.setId(7L);
            return interview;
        });

        InterviewRequest request = new InterviewRequest();
        request.setScheduledAt(LocalDateTime.now().plusDays(1));

        InterviewResponse response = interviewService.create(50L, request);

        assertThat(response.getId()).isEqualTo(7L);
        assertThat(response.getOutcome()).isEqualTo(InterviewOutcome.AWAITING_RESPONSE);
        verify(auditLogService).log(eq(currentUser), any(), anyString());
    }

    @Test
    void create_throwsResourceNotFoundException_whenApplicationNotOwned() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(applicationRepository.findByIdAndUserId(50L, 1L)).thenReturn(Optional.empty());

        InterviewRequest request = new InterviewRequest();

        assertThatThrownBy(() -> interviewService.create(50L, request))
                .isInstanceOf(ResourceNotFoundException.class);

        verify(interviewRepository, never()).save(any());
    }

    @Test
    void getForApplication_throwsResourceNotFoundException_whenApplicationNotOwned() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(applicationRepository.findByIdAndUserId(50L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> interviewService.getForApplication(50L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void getForApplication_returnsMappedList_whenOwned() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(applicationRepository.findByIdAndUserId(50L, 1L)).thenReturn(Optional.of(application));

        Interview interview = Interview.builder().application(application).user(currentUser)
                .scheduledAt(LocalDateTime.now()).build();
        interview.setId(9L);
        when(interviewRepository.findAllByUserIdAndApplicationIdOrderByScheduledAtAsc(1L, 50L))
                .thenReturn(List.of(interview));

        List<InterviewResponse> result = interviewService.getForApplication(50L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getId()).isEqualTo(9L);
    }

    @Test
    void update_throwsResourceNotFoundException_whenInterviewNotOwned() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(interviewRepository.findByIdAndUserId(9L, 1L)).thenReturn(Optional.empty());

        InterviewUpdateRequest request = new InterviewUpdateRequest();

        assertThatThrownBy(() -> interviewService.update(9L, request))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void update_onlyUpdatesProvidedFields() {
        Interview interview = Interview.builder().application(application).user(currentUser)
                .scheduledAt(LocalDateTime.now()).location("Remote").build();
        interview.setId(9L);

        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(interviewRepository.findByIdAndUserId(9L, 1L)).thenReturn(Optional.of(interview));
        when(interviewRepository.save(any(Interview.class))).thenAnswer(invocation -> invocation.getArgument(0));

        InterviewUpdateRequest request = new InterviewUpdateRequest();
        request.setLocation("Onsite");

        InterviewResponse response = interviewService.update(9L, request);

        assertThat(response.getLocation()).isEqualTo("Onsite");
        verify(auditLogService).log(eq(currentUser), any(), anyString());
    }

    @Test
    void delete_removesInterview_whenOwned() {
        Interview interview = Interview.builder().application(application).user(currentUser)
                .scheduledAt(LocalDateTime.now()).build();
        interview.setId(9L);

        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(interviewRepository.findByIdAndUserId(9L, 1L)).thenReturn(Optional.of(interview));

        interviewService.delete(9L);

        verify(interviewRepository).delete(interview);
        verify(auditLogService).log(eq(currentUser), any(), anyString());
    }

    @Test
    void delete_throwsResourceNotFoundException_whenNotOwned() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(interviewRepository.findByIdAndUserId(9L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> interviewService.delete(9L))
                .isInstanceOf(ResourceNotFoundException.class);

        verify(interviewRepository, never()).delete(any());
    }
}
