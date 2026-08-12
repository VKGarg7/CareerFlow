package com.careerflow.application;

import com.careerflow.application.dto.ApplicationRequest;
import com.careerflow.application.dto.ApplicationResponse;
import com.careerflow.application.dto.ApplicationUpdateRequest;
import com.careerflow.audit.AuditLogService;
import com.careerflow.common.SecurityUtils;
import com.careerflow.common.WorkspaceAccessUtils;
import com.careerflow.company.Company;
import com.careerflow.company.CompanyRepository;
import com.careerflow.config.FileStorageService;
import com.careerflow.coverletter.CoverLetter;
import com.careerflow.coverletter.CoverLetterRepository;
import com.careerflow.document.Document;
import com.careerflow.document.DocumentRepository;
import com.careerflow.exception.BadRequestException;
import com.careerflow.exception.ResourceNotFoundException;
import com.careerflow.followup.FollowUpRepository;
import com.careerflow.followuprule.FollowUpRuleService;
import com.careerflow.resume.Resume;
import com.careerflow.resume.ResumeLinkHistoryRepository;
import com.careerflow.resume.ResumeLinkService;
import com.careerflow.resume.ResumeRepository;
import com.careerflow.timeline.TimelineService;
import com.careerflow.user.User;
import com.careerflow.user.UserResumeRepository;
import com.careerflow.workspace.Workspace;
import com.careerflow.workspace.WorkspaceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
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
    private WorkspaceAccessUtils workspaceAccessUtils;
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
    private ResumeRepository resumeRepository;
    @Mock
    private ResumeLinkHistoryRepository resumeLinkHistoryRepository;
    @Mock
    private CoverLetterRepository coverLetterRepository;
    @Mock
    private AuditLogService auditLogService;
    @Mock
    private WorkspaceRepository workspaceRepository;
    @Mock
    private TimelineService timelineService;
    @Mock
    private FollowUpRuleService followUpRuleService;

    private ResumeLinkService resumeLinkService;
    private ApplicationService applicationService;

    private User currentUser;
    private Company company;
    private static final Long WORKSPACE_ID = 99L;

    @BeforeEach
    void setUp() {
        currentUser = new User();
        currentUser.setId(1L);

        company = Company.builder().user(currentUser).name("Acme").build();
        company.setId(100L);

        lenient().when(followUpRepository.findNearestPendingFollowUpDates(anyList())).thenReturn(List.of());
        lenient().when(followUpRepository.findNearestUpcomingFollowUpDates(anyList(), any())).thenReturn(List.of());

        resumeLinkService = new ResumeLinkService(resumeLinkHistoryRepository);
        applicationService = new ApplicationService(
                applicationRepository, companyRepository, workspaceAccessUtils, followUpRepository,
                fileStorageService, documentRepository, securityUtils, userResumeRepository,
                resumeRepository, resumeLinkService, coverLetterRepository, auditLogService,
                workspaceRepository, timelineService, followUpRuleService);
    }

    private Workspace workspace() {
        Workspace workspace = new Workspace();
        workspace.setId(WORKSPACE_ID);
        return workspace;
    }

    @Test
    void addApplication_throwsResourceNotFoundException_whenCompanyNotOwned() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(companyRepository.findByIdAndUserIdAndWorkspaceId(100L, 1L, WORKSPACE_ID)).thenReturn(Optional.empty());

        ApplicationRequest request = new ApplicationRequest();
        request.setCompanyId(100L);
        request.setRole("Backend Engineer");

        assertThatThrownBy(() -> applicationService.addApplication(request, WORKSPACE_ID))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Company not found");

        verify(applicationRepository, never()).save(any());
    }

    @Test
    void addApplication_defaultsStatusToApplied_whenStatusNotProvided() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(companyRepository.findByIdAndUserIdAndWorkspaceId(100L, 1L, WORKSPACE_ID)).thenReturn(Optional.of(company));
        when(workspaceAccessUtils.getOwnedWorkspace(WORKSPACE_ID, 1L)).thenReturn(workspace());
        when(applicationRepository.save(any(JobApplication.class))).thenAnswer(invocation -> {
            JobApplication app = invocation.getArgument(0);
            app.setId(50L);
            return app;
        });

        ApplicationRequest request = new ApplicationRequest();
        request.setCompanyId(100L);
        request.setRole("Backend Engineer");

        ApplicationResponse response = applicationService.addApplication(request, WORKSPACE_ID);

        assertThat(response.getStatus()).isEqualTo(ApplicationStatus.APPLIED);
        verify(auditLogService).log(eq(currentUser), any(), anyString());
    }

    @Test
    void addApplication_persistsAssetBundleFields() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(companyRepository.findByIdAndUserIdAndWorkspaceId(100L, 1L, WORKSPACE_ID)).thenReturn(Optional.of(company));
        when(workspaceAccessUtils.getOwnedWorkspace(WORKSPACE_ID, 1L)).thenReturn(workspace());
        when(applicationRepository.save(any(JobApplication.class))).thenAnswer(invocation -> {
            JobApplication app = invocation.getArgument(0);
            app.setId(50L);
            return app;
        });

        ApplicationRequest request = new ApplicationRequest();
        request.setCompanyId(100L);
        request.setRole("Backend Engineer");
        request.setPortfolioLink("https://portfolio.example.com");
        request.setGithubLink("https://github.com/example");
        request.setLinkedinLink("https://linkedin.com/in/example");
        request.setQuestionnaireAnswers("Q: Why us? A: Great mission.");

        ApplicationResponse response = applicationService.addApplication(request, WORKSPACE_ID);

        assertThat(response.getPortfolioLink()).isEqualTo("https://portfolio.example.com");
        assertThat(response.getGithubLink()).isEqualTo("https://github.com/example");
        assertThat(response.getLinkedinLink()).isEqualTo("https://linkedin.com/in/example");
        assertThat(response.getQuestionnaireAnswers()).isEqualTo("Q: Why us? A: Great mission.");
    }

    @Test
    void updateApplication_updatesAssetBundleFields_withoutClearingUnsetOnes() {
        JobApplication application = JobApplication.builder().user(currentUser).company(company).role("Backend Engineer")
                .portfolioLink("https://old-portfolio.com").githubLink("https://github.com/old").build();
        application.setId(50L);

        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(applicationRepository.findByIdAndUserIdAndWorkspaceId(50L, 1L, WORKSPACE_ID)).thenReturn(Optional.of(application));
        when(applicationRepository.save(any(JobApplication.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ApplicationUpdateRequest request = new ApplicationUpdateRequest();
        request.setLinkedinLink("https://linkedin.com/in/new");

        ApplicationResponse response = applicationService.updateApplication(50L, request, WORKSPACE_ID);

        assertThat(response.getLinkedinLink()).isEqualTo("https://linkedin.com/in/new");
        assertThat(response.getPortfolioLink()).isEqualTo("https://old-portfolio.com");
        assertThat(response.getGithubLink()).isEqualTo("https://github.com/old");
    }

    @Test
    void updateApplication_throwsResourceNotFoundException_whenNotOwned() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(applicationRepository.findByIdAndUserIdAndWorkspaceId(50L, 1L, WORKSPACE_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> applicationService.updateApplication(50L, new ApplicationUpdateRequest(), WORKSPACE_ID))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void updateApplication_reResolvesCompany_whenCompanyIdProvided() {
        JobApplication application = JobApplication.builder().user(currentUser).company(company).role("Backend Engineer").build();
        application.setId(50L);

        Company newCompany = Company.builder().user(currentUser).name("NewCo").build();
        newCompany.setId(200L);

        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(applicationRepository.findByIdAndUserIdAndWorkspaceId(50L, 1L, WORKSPACE_ID)).thenReturn(Optional.of(application));
        when(companyRepository.findByIdAndUserIdAndWorkspaceId(200L, 1L, WORKSPACE_ID)).thenReturn(Optional.of(newCompany));
        when(applicationRepository.save(any(JobApplication.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ApplicationUpdateRequest request = new ApplicationUpdateRequest();
        request.setCompanyId(200L);

        ApplicationResponse response = applicationService.updateApplication(50L, request, WORKSPACE_ID);

        assertThat(response.getCompanyId()).isEqualTo(200L);
    }

    @Test
    void updateApplication_throwsResourceNotFoundException_whenNewCompanyNotOwned() {
        JobApplication application = JobApplication.builder().user(currentUser).company(company).role("Backend Engineer").build();
        application.setId(50L);

        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(applicationRepository.findByIdAndUserIdAndWorkspaceId(50L, 1L, WORKSPACE_ID)).thenReturn(Optional.of(application));
        when(companyRepository.findByIdAndUserIdAndWorkspaceId(999L, 1L, WORKSPACE_ID)).thenReturn(Optional.empty());

        ApplicationUpdateRequest request = new ApplicationUpdateRequest();
        request.setCompanyId(999L);

        assertThatThrownBy(() -> applicationService.updateApplication(50L, request, WORKSPACE_ID))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void uploadDocuments_throwsBadRequestException_forDisallowedResumeExtension() {
        JobApplication application = JobApplication.builder().user(currentUser).company(company).role("Backend Engineer").build();
        application.setId(50L);

        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(applicationRepository.findByIdAndUserIdAndWorkspaceId(50L, 1L, WORKSPACE_ID)).thenReturn(Optional.of(application));

        MockMultipartFile badResume = new MockMultipartFile("resume", "resume.exe", "application/octet-stream", "x".getBytes());

        assertThatThrownBy(() -> applicationService.uploadDocuments(50L, badResume, null, null, null, null, WORKSPACE_ID))
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
        when(applicationRepository.findByIdAndUserIdAndWorkspaceId(50L, 1L, WORKSPACE_ID)).thenReturn(Optional.of(application));
        when(userResumeRepository.existsByUserIdAndDocumentId(1L, 9L)).thenReturn(true);
        when(documentRepository.findById(9L)).thenReturn(Optional.of(sourceDoc));
        when(documentRepository.save(any(Document.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(applicationRepository.save(any(JobApplication.class))).thenAnswer(invocation -> invocation.getArgument(0));

        MockMultipartFile resume = new MockMultipartFile("resume", "resume.pdf", "application/pdf", "x".getBytes());

        applicationService.uploadDocuments(50L, resume, null, 9L, null, null, WORKSPACE_ID);

        assertThat(application.getResume()).isNotNull();
        assertThat(application.getResume().getOriginalName()).isEqualTo("resume.pdf");
        verify(fileStorageService, never()).storeDocument(any(), anyString());
    }

    @Test
    void uploadDocuments_throwsResourceNotFoundException_whenProfileResumeNotOwned() {
        JobApplication application = JobApplication.builder().user(currentUser).company(company).role("Backend Engineer").build();
        application.setId(50L);

        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(applicationRepository.findByIdAndUserIdAndWorkspaceId(50L, 1L, WORKSPACE_ID)).thenReturn(Optional.of(application));
        when(userResumeRepository.existsByUserIdAndDocumentId(1L, 9L)).thenReturn(false);

        assertThatThrownBy(() -> applicationService.uploadDocuments(50L, null, null, 9L, null, null, WORKSPACE_ID))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Profile resume not found");
    }

    @Test
    void uploadDocuments_copiesFromResumeLibrary_andTracksResumeLibraryLink() {
        JobApplication application = JobApplication.builder().user(currentUser).company(company).role("Backend Engineer").build();
        application.setId(50L);

        Document sourceDoc = Document.builder().originalName("library-resume.pdf").storedPath("resume-library/xyz.pdf")
                .fileSize(200L).contentType("application/pdf").build();
        sourceDoc.setId(20L);
        Resume libraryResume = Resume.builder().user(currentUser).title("SDE Resume").document(sourceDoc).build();
        libraryResume.setId(7L);

        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(applicationRepository.findByIdAndUserIdAndWorkspaceId(50L, 1L, WORKSPACE_ID)).thenReturn(Optional.of(application));
        when(resumeRepository.findByIdAndUserIdAndWorkspaceId(7L, 1L, WORKSPACE_ID)).thenReturn(Optional.of(libraryResume));
        when(documentRepository.save(any(Document.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(applicationRepository.save(any(JobApplication.class))).thenAnswer(invocation -> invocation.getArgument(0));

        applicationService.uploadDocuments(50L, null, null, null, 7L, null, WORKSPACE_ID);

        assertThat(application.getResume()).isNotNull();
        assertThat(application.getResume().getOriginalName()).isEqualTo("library-resume.pdf");
        assertThat(application.getResumeLibrary()).isEqualTo(libraryResume);
        verify(fileStorageService, never()).storeDocument(any(), anyString());
    }

    @Test
    void uploadDocuments_throwsResourceNotFoundException_whenResumeLibraryEntryNotOwned() {
        JobApplication application = JobApplication.builder().user(currentUser).company(company).role("Backend Engineer").build();
        application.setId(50L);

        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(applicationRepository.findByIdAndUserIdAndWorkspaceId(50L, 1L, WORKSPACE_ID)).thenReturn(Optional.of(application));
        when(resumeRepository.findByIdAndUserIdAndWorkspaceId(7L, 1L, WORKSPACE_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> applicationService.uploadDocuments(50L, null, null, null, 7L, null, WORKSPACE_ID))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Resume not found");
    }

    @Test
    void uploadDocuments_copiesFromCoverLetterLibrary_andTracksCoverLetterLibraryLink() {
        JobApplication application = JobApplication.builder().user(currentUser).company(company).role("Backend Engineer").build();
        application.setId(50L);

        Document sourceDoc = Document.builder().originalName("library-cover-letter.pdf").storedPath("coverletter-library/xyz.pdf")
                .fileSize(150L).contentType("application/pdf").build();
        sourceDoc.setId(21L);
        CoverLetter libraryCoverLetter = CoverLetter.builder().user(currentUser).title("Backend Cover Letter").document(sourceDoc).build();
        libraryCoverLetter.setId(8L);

        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(applicationRepository.findByIdAndUserIdAndWorkspaceId(50L, 1L, WORKSPACE_ID)).thenReturn(Optional.of(application));
        when(coverLetterRepository.findByIdAndUserIdAndWorkspaceId(8L, 1L, WORKSPACE_ID)).thenReturn(Optional.of(libraryCoverLetter));
        when(documentRepository.save(any(Document.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(applicationRepository.save(any(JobApplication.class))).thenAnswer(invocation -> invocation.getArgument(0));

        applicationService.uploadDocuments(50L, null, null, null, null, 8L, WORKSPACE_ID);

        assertThat(application.getCoverLetter()).isNotNull();
        assertThat(application.getCoverLetter().getOriginalName()).isEqualTo("library-cover-letter.pdf");
        assertThat(application.getCoverLetterLibrary()).isEqualTo(libraryCoverLetter);
        verify(fileStorageService, never()).storeDocument(any(), anyString());
    }

    @Test
    void uploadDocuments_throwsResourceNotFoundException_whenCoverLetterLibraryEntryNotOwned() {
        JobApplication application = JobApplication.builder().user(currentUser).company(company).role("Backend Engineer").build();
        application.setId(50L);

        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(applicationRepository.findByIdAndUserIdAndWorkspaceId(50L, 1L, WORKSPACE_ID)).thenReturn(Optional.of(application));
        when(coverLetterRepository.findByIdAndUserIdAndWorkspaceId(8L, 1L, WORKSPACE_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> applicationService.uploadDocuments(50L, null, null, null, null, 8L, WORKSPACE_ID))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Cover letter not found");
    }

    @Test
    void getMyResumeAnalysis_computesOaClearsAndDefensiveRates() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        ApplicationRepository.ResumeCount row = mock(ApplicationRepository.ResumeCount.class);
        when(row.getResumeId()).thenReturn(10L);
        when(row.getResumeTitle()).thenReturn("SDE Resume");
        when(row.getRoleCategory()).thenReturn("Backend");
        when(row.getTotal()).thenReturn(4L);
        when(row.getOaClears()).thenReturn(3L);
        when(row.getInterviews()).thenReturn(2L);
        when(row.getOffers()).thenReturn(1L);
        when(applicationRepository.countByResumeGroupedForUser(1L, WORKSPACE_ID, null)).thenReturn(List.of(row));

        List<com.careerflow.application.dto.ResumeAnalysisItem> result = applicationService.getMyResumeAnalysis(WORKSPACE_ID, null);

        assertThat(result).hasSize(1);
        com.careerflow.application.dto.ResumeAnalysisItem item = result.get(0);
        assertThat(item.getRoleCategory()).isEqualTo("Backend");
        assertThat(item.getOaClears()).isEqualTo(3L);
        assertThat(item.getInterviewRate()).isEqualTo(0.5);
        assertThat(item.getOfferRate()).isEqualTo(0.25);
    }

    @Test
    void getMyResumeAnalysis_ratesAreZero_whenTotalIsZero() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        ApplicationRepository.ResumeCount row = mock(ApplicationRepository.ResumeCount.class);
        when(row.getResumeId()).thenReturn(10L);
        when(row.getTotal()).thenReturn(0L);
        when(row.getOaClears()).thenReturn(0L);
        when(row.getInterviews()).thenReturn(0L);
        when(row.getOffers()).thenReturn(0L);
        when(applicationRepository.countByResumeGroupedForUser(1L, WORKSPACE_ID, null)).thenReturn(List.of(row));

        List<com.careerflow.application.dto.ResumeAnalysisItem> result = applicationService.getMyResumeAnalysis(WORKSPACE_ID, null);

        assertThat(result.get(0).getInterviewRate()).isEqualTo(0);
        assertThat(result.get(0).getOfferRate()).isEqualTo(0);
    }

    @Test
    void getMyResumeAnalysis_passesRoleCategoryFilterThrough() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(applicationRepository.countByResumeGroupedForUser(1L, WORKSPACE_ID, "Backend")).thenReturn(List.of());

        applicationService.getMyResumeAnalysis(WORKSPACE_ID, "Backend");

        verify(applicationRepository).countByResumeGroupedForUser(1L, WORKSPACE_ID, "Backend");
    }

    @Test
    void deleteDocument_throwsResourceNotFoundException_whenDocumentIdMatchesNeitherResumeNorCoverLetter() {
        JobApplication application = JobApplication.builder().user(currentUser).company(company).role("Backend Engineer").build();
        application.setId(50L);

        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(applicationRepository.findByIdAndUserIdAndWorkspaceId(50L, 1L, WORKSPACE_ID)).thenReturn(Optional.of(application));

        assertThatThrownBy(() -> applicationService.deleteDocument(50L, 999L, WORKSPACE_ID))
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
        when(applicationRepository.findByIdAndUserIdAndWorkspaceId(50L, 1L, WORKSPACE_ID)).thenReturn(Optional.of(application));
        when(applicationRepository.save(any(JobApplication.class))).thenAnswer(invocation -> invocation.getArgument(0));

        applicationService.deleteDocument(50L, 9L, WORKSPACE_ID);

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
        when(applicationRepository.findByIdAndUserIdAndWorkspaceId(50L, 1L, WORKSPACE_ID)).thenReturn(Optional.of(application));

        applicationService.deleteApplication(50L, WORKSPACE_ID);

        assertThat(application.getDeletedAt()).isNotNull();
        verify(applicationRepository).save(application);
    }

    @Test
    void hasApplications_delegatesToRepository() {
        when(applicationRepository.existsByUserIdAndCompanyIdAndWorkspaceId(1L, 100L, WORKSPACE_ID)).thenReturn(true);

        assertThat(applicationService.hasApplications(1L, 100L, WORKSPACE_ID)).isTrue();
    }
}
