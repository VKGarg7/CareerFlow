package com.careerflow.followup;

import com.careerflow.application.ApplicationRepository;
import com.careerflow.application.JobApplication;
import com.careerflow.common.PageResponse;
import com.careerflow.common.SecurityUtils;
import com.careerflow.company.Company;
import com.careerflow.exception.ResourceNotFoundException;
import com.careerflow.followup.dto.FollowUpRequest;
import com.careerflow.followup.dto.FollowUpResponse;
import com.careerflow.followup.dto.FollowUpUpdateRequest;
import com.careerflow.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@SuppressWarnings("null")
@ExtendWith(MockitoExtension.class)
class FollowUpServiceTest {

    @Mock
    private FollowUpRepository followUpRepository;
    @Mock
    private ApplicationRepository applicationRepository;
    @Mock
    private SecurityUtils securityUtils;

    @InjectMocks
    private FollowUpService followUpService;

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
    void createFollowUp_throwsResourceNotFoundException_whenApplicationNotOwned() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(applicationRepository.findByIdAndUserId(50L, 1L)).thenReturn(Optional.empty());

        FollowUpRequest request = new FollowUpRequest();

        assertThatThrownBy(() -> followUpService.createFollowUp(50L, request))
                .isInstanceOf(ResourceNotFoundException.class);

        verify(followUpRepository, never()).save(any());
    }

    @Test
    void createFollowUp_savesFollowUp_whenApplicationOwned() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(applicationRepository.findByIdAndUserId(50L, 1L)).thenReturn(Optional.of(application));
        when(followUpRepository.save(any(FollowUp.class))).thenAnswer(invocation -> {
            FollowUp followUp = invocation.getArgument(0);
            followUp.setId(9L);
            return followUp;
        });

        FollowUpRequest request = new FollowUpRequest();
        request.setFollowUpDate(LocalDate.now().plusDays(3));
        request.setNote("Ping recruiter");

        FollowUpResponse response = followUpService.createFollowUp(50L, request);

        assertThat(response.getId()).isEqualTo(9L);
        assertThat(response.getNote()).isEqualTo("Ping recruiter");
    }

    @Test
    void getAllFollowUps_usesBucketQuery_onlyWhenStatusIsPending() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        Page<FollowUp> emptyPage = new PageImpl<>(List.of());
        when(followUpRepository.findAllByUserIdAndStatusAndFollowUpDateBefore(eq(1L), eq(FollowUpStatus.PENDING), any(LocalDate.class), any(Pageable.class)))
                .thenReturn(emptyPage);

        PageResponse<FollowUpResponse> response =
                followUpService.getAllFollowUps(null, FollowUpStatus.PENDING, FollowUpBucket.OVERDUE, 0, 10);

        assertThat(response.getContent()).isEmpty();
        verify(followUpRepository).findAllByUserIdAndStatusAndFollowUpDateBefore(eq(1L), eq(FollowUpStatus.PENDING), any(LocalDate.class), any(Pageable.class));
    }

    @Test
    void getAllFollowUps_ignoresBucket_whenStatusIsNotPending() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        Page<FollowUp> emptyPage = new PageImpl<>(List.of());
        when(followUpRepository.findAllByUserIdAndStatusOrderByFollowUpDateAsc(eq(1L), eq(FollowUpStatus.DONE), any(Pageable.class)))
                .thenReturn(emptyPage);

        followUpService.getAllFollowUps(null, FollowUpStatus.DONE, FollowUpBucket.OVERDUE, 0, 10);

        verify(followUpRepository).findAllByUserIdAndStatusOrderByFollowUpDateAsc(eq(1L), eq(FollowUpStatus.DONE), any(Pageable.class));
        verify(followUpRepository, never()).findAllByUserIdAndStatusAndFollowUpDateBefore(any(), any(), any(), any());
    }

    @Test
    void updateFollowUp_throwsResourceNotFoundException_whenNotOwned() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(followUpRepository.findByIdAndUserId(9L, 1L)).thenReturn(Optional.empty());

        FollowUpUpdateRequest request = new FollowUpUpdateRequest();

        assertThatThrownBy(() -> followUpService.updateFollowUp(9L, request))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void toResponse_marksOverdue_whenPendingAndDateIsInThePast() {
        FollowUp followUp = FollowUp.builder().application(application).user(currentUser)
                .followUpDate(LocalDate.now().minusDays(1)).status(FollowUpStatus.PENDING).build();
        followUp.setId(9L);

        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(followUpRepository.findByIdAndUserId(9L, 1L)).thenReturn(Optional.of(followUp));
        when(followUpRepository.save(any(FollowUp.class))).thenAnswer(invocation -> invocation.getArgument(0));

        FollowUpResponse response = followUpService.updateFollowUp(9L, new FollowUpUpdateRequest());

        assertThat(response.isOverdue()).isTrue();
    }

    @Test
    void toResponse_notOverdue_whenFollowUpDateIsToday() {
        FollowUp followUp = FollowUp.builder().application(application).user(currentUser)
                .followUpDate(LocalDate.now()).status(FollowUpStatus.PENDING).build();
        followUp.setId(9L);

        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(followUpRepository.findByIdAndUserId(9L, 1L)).thenReturn(Optional.of(followUp));
        when(followUpRepository.save(any(FollowUp.class))).thenAnswer(invocation -> invocation.getArgument(0));

        FollowUpResponse response = followUpService.updateFollowUp(9L, new FollowUpUpdateRequest());

        assertThat(response.isOverdue()).isFalse();
    }

    @Test
    void deleteFollowUp_removesFollowUp_whenOwned() {
        FollowUp followUp = FollowUp.builder().application(application).user(currentUser)
                .followUpDate(LocalDate.now()).build();
        followUp.setId(9L);

        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(followUpRepository.findByIdAndUserId(9L, 1L)).thenReturn(Optional.of(followUp));

        followUpService.deleteFollowUp(9L);

        verify(followUpRepository).delete(followUp);
    }
}
