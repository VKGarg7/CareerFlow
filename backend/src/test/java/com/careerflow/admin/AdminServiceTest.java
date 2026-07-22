package com.careerflow.admin;

import com.careerflow.admin.dto.AdminUserResponse;
import com.careerflow.application.ApplicationRepository;
import com.careerflow.audit.AuditLogService;
import com.careerflow.common.SecurityUtils;
import com.careerflow.company.CompanyRepository;
import com.careerflow.exception.BadRequestException;
import com.careerflow.exception.ResourceNotFoundException;
import com.careerflow.interview.InterviewRepository;
import com.careerflow.referral.ReferralRequestRepository;
import com.careerflow.user.Role;
import com.careerflow.user.User;
import com.careerflow.user.UserRepository;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@SuppressWarnings("null")
@ExtendWith(MockitoExtension.class)
class AdminServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private ApplicationRepository applicationRepository;
    @Mock
    private InterviewRepository interviewRepository;
    @Mock
    private CompanyRepository companyRepository;
    @Mock
    private ReferralRequestRepository referralRepository;
    @Mock
    private SecurityUtils securityUtils;
    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private AdminService adminService;

    private User admin;

    @BeforeEach
    void setUp() {
        admin = User.builder().id(1L).email("admin@example.com").role(Role.ADMIN).build();
    }

    @Test
    void setUserActive_throwsBadRequestException_whenAdminDeactivatesSelf() {
        when(securityUtils.getCurrentUser()).thenReturn(admin);
        when(userRepository.findById(1L)).thenReturn(Optional.of(admin));

        assertThatThrownBy(() -> adminService.setUserActive(1L, false))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("cannot deactivate your own account");

        verify(userRepository, never()).save(any());
    }

    @Test
    void setUserActive_allowsAdminToActivateSelf() {
        when(securityUtils.getCurrentUser()).thenReturn(admin);
        when(userRepository.findById(1L)).thenReturn(Optional.of(admin));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AdminUserResponse response = adminService.setUserActive(1L, true);

        assertThat(response.isActive()).isTrue();
    }

    @Test
    void setUserActive_deactivatesOtherUser() {
        User target = User.builder().id(2L).email("user@example.com").role(Role.USER).build();

        when(securityUtils.getCurrentUser()).thenReturn(admin);
        when(userRepository.findById(2L)).thenReturn(Optional.of(target));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AdminUserResponse response = adminService.setUserActive(2L, false);

        assertThat(response.isActive()).isFalse();
        verify(auditLogService).log(eq(admin), any(), anyString());
    }

    @Test
    void setUserActive_throwsResourceNotFoundException_whenUserMissing() {
        when(securityUtils.getCurrentUser()).thenReturn(admin);
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> adminService.setUserActive(99L, true))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void setUserRole_throwsBadRequestException_whenAdminRemovesOwnAdminRole() {
        when(securityUtils.getCurrentUser()).thenReturn(admin);
        when(userRepository.findById(1L)).thenReturn(Optional.of(admin));

        assertThatThrownBy(() -> adminService.setUserRole(1L, Role.USER))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("cannot remove your own admin role");

        verify(userRepository, never()).save(any());
    }

    @Test
    void setUserRole_allowsAdminToReaffirmOwnAdminRole() {
        when(securityUtils.getCurrentUser()).thenReturn(admin);
        when(userRepository.findById(1L)).thenReturn(Optional.of(admin));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AdminUserResponse response = adminService.setUserRole(1L, Role.ADMIN);

        assertThat(response.getRole()).isEqualTo(Role.ADMIN);
    }

    @Test
    void setUserRole_promotesOtherUser() {
        User target = User.builder().id(2L).email("user@example.com").role(Role.USER).build();

        when(securityUtils.getCurrentUser()).thenReturn(admin);
        when(userRepository.findById(2L)).thenReturn(Optional.of(target));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AdminUserResponse response = adminService.setUserRole(2L, Role.ADMIN);

        assertThat(response.getRole()).isEqualTo(Role.ADMIN);
    }
}
