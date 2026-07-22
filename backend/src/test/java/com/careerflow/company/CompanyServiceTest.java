package com.careerflow.company;

import com.careerflow.application.ApplicationService;
import com.careerflow.audit.AuditLogService;
import com.careerflow.common.SecurityUtils;
import com.careerflow.company.dto.CompanyRequest;
import com.careerflow.company.dto.CompanyResponse;
import com.careerflow.company.dto.CompanyUpdateRequest;
import com.careerflow.exception.ConflictException;
import com.careerflow.exception.DuplicateResourceException;
import com.careerflow.exception.ResourceNotFoundException;
import com.careerflow.followup.FollowUpService;
import com.careerflow.user.User;
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
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link CompanyService} using JUnit 5 + Mockito.
 * Dependencies are mocked so the service logic is verified in isolation,
 * without spinning up Spring context or a database.
 */
@SuppressWarnings("null")
@ExtendWith(MockitoExtension.class)
class CompanyServiceTest {

    @Mock
    private CompanyRepository companyRepository;
    @Mock
    private SecurityUtils securityUtils;
    @Mock
    private AuditLogService auditLogService;
    @Mock
    private ApplicationService applicationService;
    @Mock
    private FollowUpService followUpService;

    @InjectMocks
    private CompanyService companyService;

    private User currentUser;

    @BeforeEach
    void setUp() {
        currentUser = new User();
        currentUser.setId(1L);
    }

    @Test
    void addCompany_savesAndReturnsResponse_whenNameIsUnique() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(companyRepository.existsByUserIdAndNameIgnoreCase(1L, "Acme")).thenReturn(false);
        when(companyRepository.save(any(Company.class))).thenAnswer(invocation -> {
            Company company = invocation.getArgument(0);
            company.setId(10L);
            return company;
        });

        CompanyRequest request = new CompanyRequest();
        request.setName("Acme");

        CompanyResponse response = companyService.addCompany(request);

        assertThat(response.getId()).isEqualTo(10L);
        assertThat(response.getName()).isEqualTo("Acme");
        assertThat(response.getStatus()).isEqualTo(CompanyStatus.TARGETING);
        verify(companyRepository).save(any(Company.class));
        verify(auditLogService).log(eq(currentUser), any(), anyString());
    }

    @Test
    void addCompany_throwsDuplicateResourceException_whenNameAlreadyExists() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(companyRepository.existsByUserIdAndNameIgnoreCase(1L, "Acme")).thenReturn(true);

        CompanyRequest request = new CompanyRequest();
        request.setName("Acme");

        assertThatThrownBy(() -> companyService.addCompany(request))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("Acme");

        verify(companyRepository, never()).save(any());
    }

    @Test
    void updateCompany_throwsResourceNotFoundException_whenCompanyNotOwnedByUser() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(companyRepository.findByIdAndUserId(99L, 1L)).thenReturn(Optional.empty());

        CompanyUpdateRequest request = new CompanyUpdateRequest();

        assertThatThrownBy(() -> companyService.updateCompany(99L, request))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void deleteCompany_throwsConflictException_whenHasApplicationsAndNotForced() {
        Company company = Company.builder().user(currentUser).name("Acme").build();
        company.setId(5L);

        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(companyRepository.findByIdAndUserId(5L, 1L)).thenReturn(Optional.of(company));
        when(applicationService.hasApplications(1L, 5L)).thenReturn(true);

        assertThatThrownBy(() -> companyService.deleteCompany(5L, false))
                .isInstanceOf(ConflictException.class);

        verify(companyRepository, never()).save(any());
    }

    @Test
    void deleteCompany_deletesApplicationsAndSoftDeletesCompany_whenForced() {
        Company company = Company.builder().user(currentUser).name("Acme").build();
        company.setId(5L);

        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(companyRepository.findByIdAndUserId(5L, 1L)).thenReturn(Optional.of(company));
        when(applicationService.hasApplications(1L, 5L)).thenReturn(true);
        when(companyRepository.save(any(Company.class))).thenAnswer(invocation -> invocation.getArgument(0));

        companyService.deleteCompany(5L, true);

        verify(applicationService).deleteAllByCompany(5L);
        verify(companyRepository).save(argThat(c -> c.getDeletedAt() != null));
    }
}
