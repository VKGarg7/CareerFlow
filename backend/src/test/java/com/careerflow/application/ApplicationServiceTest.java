package com.careerflow.application;

import com.careerflow.application.dto.ApplicationRequest;
import com.careerflow.application.dto.ApplicationResponse;
import com.careerflow.application.dto.ApplicationUpdateRequest;
import com.careerflow.audit.AuditLogService;
import com.careerflow.common.SecurityUtils;
import com.careerflow.company.Company;
import com.careerflow.company.CompanyRepository;
import com.careerflow.config.FileStorageService;
import com.careerflow.document.Document;
import com.careerflow.document.DocumentRepository;
import com.careerflow.exception.BadRequestException;
import com.careerflow.exception.ResourceNotFoundException;
import com.careerflow.followup.FollowUpRepository;
import com.careerflow.user.User;
import com.careerflow.user.UserResumeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@SuppressWarnings("null")
@ExtendWith(MockitoExtension.class)
class ApplicationServiceTest {

    @Mock
    private ApplicationRepository applicationRepository;
    @Mock
    private CompanyRepository companyRepository;
    @Mock
    private FollowUpRepository followUpRepository;
    @Mock
    private FileStorageService fileStorageService;
    @Mock
    private DocumentRepository documentRepository;
    @Mock
    private SecurityUtils securityUtils;
    @Mock
    private UserResumeRepository userResumeRepository;
    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private ApplicationService applicationService;

    private User currentUser;
    private Company company;

    @BeforeEach
    void setUp() {
        currentUser = new User();
        currentUser.setId(1L);

        company = Company.builder().user(currentUser).name("Acme").build();
        company.setId(100L);

        lenient().when(followUpRepository.findNearestPendingFollowUpDates(anyList())).thenReturn(List.of());
        lenient().when(followUpRepository.findNearestUpcomingFollowUpDates(anyList(), any())).thenReturn(List.of());
    }

    @Test
    void addApplication_throwsResourceNotFoundException_whenCompanyNotOwned() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(companyRepository.findByIdAndUserId(100L, 1L)).thenReturn(Optional.empty());

        ApplicationRequest request = new ApplicationRequest();
        request.setCompanyId(100L);
        request.setRole("Backend Engineer");

        assertThatThrownBy(() -> applicationService.addApplication(request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Company not found");

        verify(applicationRepository, never()).save(any());
    }

    @Test
    void addApplication_defaultsStatusToApplied_whenStatusNotProvided() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(companyRepository.findByIdAndUserId(100L, 1L)).thenReturn(Optional.of(company));
        when(applicationRepository.save(any(JobApplication.class))).thenAnswer(invocation -> {
            JobApplication app = invocation.getArgument(0);
            app.setId(50L);
            return app;
        });

        ApplicationRequest request = new ApplicationRequest();
        request.setCompanyId(100L);
        request.setRole("Backend Engineer");

        ApplicationResponse response = applicationService.addApplication(request);

        assertThat(response.getStatus()).isEqualTo(ApplicationStatus.APPLIED);
        verify(auditLogService).log(eq(currentUser), any(), anyString());
    }

    @Test
    void updateApplication_throwsResourceNotFoundException_whenNotOwned() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(applicationRepository.findByIdAndUserId(50L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> applicationService.updateApplication(50L, new ApplicationUpdateRequest()))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void updateApplication_reResolvesCompany_whenCompanyIdProvided() {
        JobApplication application = JobApplication.builder().user(currentUser).company(company).role("Backend Engineer").build();
        application.setId(50L);

        Company newCompany = Company.builder().user(currentUser).name("NewCo").build();
        newCompany.setId(200L);

        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(applicationRepository.findByIdAndUserId(50L, 1L)).thenReturn(Optional.of(application));
        when(companyRepository.findByIdAndUserId(200L, 1L)).thenReturn(Optional.of(newCompany));
        when(applicationRepository.save(any(JobApplication.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ApplicationUpdateRequest request = new ApplicationUpdateRequest();
        request.setCompanyId(200L);

        ApplicationResponse response = applicationService.updateApplication(50L, request);

        assertThat(response.getCompanyId()).isEqualTo(200L);
    }

    @Test
    void updateApplication_throwsResourceNotFoundException_whenNewCompanyNotOwned() {
        JobApplication application = JobApplication.builder().user(currentUser).company(company).role("Backend Engineer").build();
        application.setId(50L);

        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(applicationRepository.findByIdAndUserId(50L, 1L)).thenReturn(Optional.of(application));
        when(companyRepository.findByIdAndUserId(999L, 1L)).thenReturn(Optional.empty());

        ApplicationUpdateRequest request = new ApplicationUpdateRequest();
        request.setCompanyId(999L);

        assertThatThrownBy(() -> applicationService.updateApplication(50L, request))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void uploadDocuments_throwsBadRequestException_forDisallowedResumeExtension() {
        JobApplication application = JobApplication.builder().user(currentUser).company(company).role("Backend Engineer").build();
        application.setId(50L);

        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(applicationRepository.findByIdAndUserId(50L, 1L)).thenReturn(Optional.of(application));

        MockMultipartFile badResume = new MockMultipartFile("resume", "resume.exe", "application/octet-stream", "x".getBytes());

        assertThatThrownBy(() -> applicationService.uploadDocuments(50L, badResume, null, null))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("PDF, DOC, and DOCX");

        verify(fileStorageService, never()).storeDocument(any(), anyString());
    }

    @Test
    void uploadDocuments_prioritizesProfileResumeCopy_overUploadedResume() {
        JobApplication application = JobApplication.builder().user(currentUser).company(company).role("Backend Engineer").build();
        application.setId(50L);

        Document sourceDoc = Document.builder().originalName("resume.pdf").storedPath("/tmp/resume.pdf")
                .fileSize(100L).contentType("application/pdf").build();
        sourceDoc.setId(9L);

        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(applicationRepository.findByIdAndUserId(50L, 1L)).thenReturn(Optional.of(application));
        when(userResumeRepository.existsByUserIdAndDocumentId(1L, 9L)).thenReturn(true);
        when(documentRepository.findById(9L)).thenReturn(Optional.of(sourceDoc));
        when(documentRepository.save(any(Document.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(applicationRepository.save(any(JobApplication.class))).thenAnswer(invocation -> invocation.getArgument(0));

        MockMultipartFile resume = new MockMultipartFile("resume", "resume.pdf", "application/pdf", "x".getBytes());

        applicationService.uploadDocuments(50L, resume, null, 9L);

        assertThat(application.getResume()).isNotNull();
        assertThat(application.getResume().getOriginalName()).isEqualTo("resume.pdf");
        verify(fileStorageService, never()).storeDocument(any(), anyString());
    }

    @Test
    void uploadDocuments_throwsResourceNotFoundException_whenProfileResumeNotOwned() {
        JobApplication application = JobApplication.builder().user(currentUser).company(company).role("Backend Engineer").build();
        application.setId(50L);

        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(applicationRepository.findByIdAndUserId(50L, 1L)).thenReturn(Optional.of(application));
        when(userResumeRepository.existsByUserIdAndDocumentId(1L, 9L)).thenReturn(false);

        assertThatThrownBy(() -> applicationService.uploadDocuments(50L, null, null, 9L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Profile resume not found");
    }

    @Test
    void deleteDocument_throwsResourceNotFoundException_whenDocumentIdMatchesNeitherResumeNorCoverLetter() {
        JobApplication application = JobApplication.builder().user(currentUser).company(company).role("Backend Engineer").build();
        application.setId(50L);

        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(applicationRepository.findByIdAndUserId(50L, 1L)).thenReturn(Optional.of(application));

        assertThatThrownBy(() -> applicationService.deleteDocument(50L, 999L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void deleteDocument_removesCoverLetter_whenDocumentIdMatchesIt() {
        Document coverLetter = Document.builder().originalName("cover.pdf").build();
        coverLetter.setId(9L);

        JobApplication application = JobApplication.builder().user(currentUser).company(company)
                .role("Backend Engineer").coverLetter(coverLetter).build();
        application.setId(50L);

        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(applicationRepository.findByIdAndUserId(50L, 1L)).thenReturn(Optional.of(application));
        when(applicationRepository.save(any(JobApplication.class))).thenAnswer(invocation -> invocation.getArgument(0));

        applicationService.deleteDocument(50L, 9L);

        assertThat(application.getCoverLetter()).isNull();
    }

    @Test
    void downloadDocument_throwsResourceNotFoundException_whenNotOwnedByEitherResumeOrCoverLetter() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(applicationRepository.findByResumeIdAndUserId(9L, 1L)).thenReturn(Optional.empty());
        when(applicationRepository.findByCoverLetterIdAndUserId(9L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> applicationService.downloadDocument(9L, true))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void deleteApplication_softDeletes_whenOwned() {
        JobApplication application = JobApplication.builder().user(currentUser).company(company).role("Backend Engineer").build();
        application.setId(50L);

        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(applicationRepository.findByIdAndUserId(50L, 1L)).thenReturn(Optional.of(application));

        applicationService.deleteApplication(50L);

        assertThat(application.getDeletedAt()).isNotNull();
        verify(applicationRepository).save(application);
    }

    @Test
    void hasApplications_delegatesToRepository() {
        when(applicationRepository.existsByUserIdAndCompanyId(1L, 100L)).thenReturn(true);

        assertThat(applicationService.hasApplications(1L, 100L)).isTrue();
    }
}
