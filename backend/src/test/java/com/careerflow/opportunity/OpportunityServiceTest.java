package com.careerflow.opportunity;

import com.careerflow.application.ApplicationRepository;
import com.careerflow.application.ApplicationService;
import com.careerflow.application.ApplicationSource;
import com.careerflow.application.JobApplication;
import com.careerflow.application.dto.ApplicationRequest;
import com.careerflow.application.dto.ApplicationResponse;
import com.careerflow.audit.AuditLogService;
import com.careerflow.common.SecurityUtils;
import com.careerflow.common.WorkspaceAccessUtils;
import com.careerflow.company.Company;
import com.careerflow.company.CompanyRepository;
import com.careerflow.coverletter.CoverLetter;
import com.careerflow.coverletter.CoverLetterRepository;
import com.careerflow.exception.ConflictException;
import com.careerflow.exception.ResourceNotFoundException;
import com.careerflow.opportunity.dto.DuplicateCheckRequest;
import com.careerflow.opportunity.dto.DuplicateMatch;
import com.careerflow.opportunity.dto.OpportunityConvertRequest;
import com.careerflow.opportunity.dto.OpportunityRequest;
import com.careerflow.opportunity.dto.OpportunityResponse;
import com.careerflow.opportunity.dto.OpportunityUpdateRequest;
import com.careerflow.resume.Resume;
import com.careerflow.resume.ResumeLinkHistoryRepository;
import com.careerflow.resume.ResumeLinkService;
import com.careerflow.resume.ResumeRepository;
import com.careerflow.user.User;
import com.careerflow.workspace.Workspace;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@SuppressWarnings("null")
@ExtendWith(MockitoExtension.class)
class OpportunityServiceTest {

    @Mock
    private OpportunityRepository opportunityRepository;
    @Mock
    private CompanyRepository companyRepository;
    @Mock
    private WorkspaceAccessUtils workspaceAccessUtils;
    @Mock
    private SecurityUtils securityUtils;
    @Mock
    private AuditLogService auditLogService;
    @Mock
    private ApplicationService applicationService;
    @Mock
    private ApplicationRepository applicationRepository;
    @Mock
    private ResumeRepository resumeRepository;
    @Mock
    private ResumeLinkHistoryRepository resumeLinkHistoryRepository;
    @Mock
    private CoverLetterRepository coverLetterRepository;

    private ResumeLinkService resumeLinkService;
    private OpportunityService opportunityService;

    private User currentUser;
    private static final Long WORKSPACE_ID = 99L;
    private static final Long COMPANY_ID = 5L;

    @BeforeEach
    void setUp() {
        currentUser = new User();
        currentUser.setId(1L);

        resumeLinkService = new ResumeLinkService(resumeLinkHistoryRepository);
        opportunityService = new OpportunityService(
                opportunityRepository, companyRepository, workspaceAccessUtils, securityUtils,
                auditLogService, applicationService, applicationRepository, resumeRepository, resumeLinkService,
                coverLetterRepository);
    }

    private Workspace workspace() {
        Workspace workspace = new Workspace();
        workspace.setId(WORKSPACE_ID);
        return workspace;
    }

    private Company company() {
        Company company = new Company();
        company.setId(COMPANY_ID);
        company.setName("Acme Corp");
        return company;
    }

    private OpportunityRequest request() {
        OpportunityRequest request = new OpportunityRequest();
        request.setCompanyId(COMPANY_ID);
        request.setRoleTitle("Backend Engineer");
        request.setJobLink("https://example.com/job");
        request.setLocation("Remote");
        request.setRoleCategory("Engineering");
        request.setSalaryInfo("120k-140k");
        request.setNotes("Looks promising");
        return request;
    }

    private Opportunity opportunity(Long id, OpportunityStatus status) {
        Opportunity opportunity = Opportunity.builder()
                .user(currentUser)
                .workspace(workspace())
                .company(company())
                .roleTitle("Backend Engineer")
                .status(status)
                .build();
        opportunity.setId(id);
        return opportunity;
    }

    @Test
    void addOpportunity_savesAndReturnsResponse_withDefaultSavedStatus() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(companyRepository.findByIdAndUserIdAndWorkspaceId(COMPANY_ID, 1L, WORKSPACE_ID))
                .thenReturn(Optional.of(company()));
        when(workspaceAccessUtils.getOwnedWorkspace(WORKSPACE_ID, 1L)).thenReturn(workspace());
        when(opportunityRepository.save(any(Opportunity.class))).thenAnswer(invocation -> {
            Opportunity opportunity = invocation.getArgument(0);
            opportunity.setId(10L);
            return opportunity;
        });

        OpportunityResponse response = opportunityService.addOpportunity(request(), WORKSPACE_ID);

        assertThat(response.getId()).isEqualTo(10L);
        assertThat(response.getStatus()).isEqualTo(OpportunityStatus.SAVED);
        assertThat(response.getCompanyName()).isEqualTo("Acme Corp");
        verify(auditLogService).log(eq(currentUser), eq(com.careerflow.audit.AuditAction.OPPORTUNITY_CREATED), anyString());
    }

    @Test
    void addOpportunity_throwsResourceNotFoundException_whenCompanyNotOwned() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(companyRepository.findByIdAndUserIdAndWorkspaceId(COMPANY_ID, 1L, WORKSPACE_ID))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> opportunityService.addOpportunity(request(), WORKSPACE_ID))
                .isInstanceOf(ResourceNotFoundException.class);

        verify(opportunityRepository, never()).save(any());
    }

    @Test
    void updateOpportunity_updatesOnlyProvidedFields() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        Opportunity existing = opportunity(3L, OpportunityStatus.SAVED);
        when(opportunityRepository.findByIdAndUserIdAndWorkspaceId(3L, 1L, WORKSPACE_ID))
                .thenReturn(Optional.of(existing));
        when(opportunityRepository.save(any(Opportunity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OpportunityUpdateRequest update = new OpportunityUpdateRequest();
        update.setStatus(OpportunityStatus.READY_TO_APPLY);

        OpportunityResponse response = opportunityService.updateOpportunity(3L, update, WORKSPACE_ID);

        assertThat(response.getStatus()).isEqualTo(OpportunityStatus.READY_TO_APPLY);
        assertThat(response.getRoleTitle()).isEqualTo("Backend Engineer");
        verify(auditLogService).log(eq(currentUser), eq(com.careerflow.audit.AuditAction.OPPORTUNITY_UPDATED), anyString());
    }

    @Test
    void addOpportunity_persistsAssetBundleFields() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(companyRepository.findByIdAndUserIdAndWorkspaceId(COMPANY_ID, 1L, WORKSPACE_ID))
                .thenReturn(Optional.of(company()));
        when(workspaceAccessUtils.getOwnedWorkspace(WORKSPACE_ID, 1L)).thenReturn(workspace());
        when(opportunityRepository.save(any(Opportunity.class))).thenAnswer(invocation -> {
            Opportunity opportunity = invocation.getArgument(0);
            opportunity.setId(11L);
            return opportunity;
        });

        OpportunityRequest request = request();
        request.setPortfolioLink("https://portfolio.example.com");
        request.setGithubLink("https://github.com/example");
        request.setLinkedinLink("https://linkedin.com/in/example");
        request.setQuestionnaireAnswers("Q: Why us? A: Great mission.");

        OpportunityResponse response = opportunityService.addOpportunity(request, WORKSPACE_ID);

        assertThat(response.getPortfolioLink()).isEqualTo("https://portfolio.example.com");
        assertThat(response.getGithubLink()).isEqualTo("https://github.com/example");
        assertThat(response.getLinkedinLink()).isEqualTo("https://linkedin.com/in/example");
        assertThat(response.getQuestionnaireAnswers()).isEqualTo("Q: Why us? A: Great mission.");
    }

    @Test
    void updateOpportunity_updatesAssetBundleFields_withoutClearingUnsetOnes() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        Opportunity existing = opportunity(6L, OpportunityStatus.SAVED);
        existing.setPortfolioLink("https://old-portfolio.com");
        existing.setGithubLink("https://github.com/old");
        when(opportunityRepository.findByIdAndUserIdAndWorkspaceId(6L, 1L, WORKSPACE_ID))
                .thenReturn(Optional.of(existing));
        when(opportunityRepository.save(any(Opportunity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OpportunityUpdateRequest update = new OpportunityUpdateRequest();
        update.setLinkedinLink("https://linkedin.com/in/new");

        OpportunityResponse response = opportunityService.updateOpportunity(6L, update, WORKSPACE_ID);

        assertThat(response.getLinkedinLink()).isEqualTo("https://linkedin.com/in/new");
        assertThat(response.getPortfolioLink()).isEqualTo("https://old-portfolio.com");
        assertThat(response.getGithubLink()).isEqualTo("https://github.com/old");
    }

    @Test
    void updateOpportunity_linksCoverLetterFromLibrary() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        Opportunity existing = opportunity(4L, OpportunityStatus.SAVED);
        when(opportunityRepository.findByIdAndUserIdAndWorkspaceId(4L, 1L, WORKSPACE_ID))
                .thenReturn(Optional.of(existing));
        when(opportunityRepository.save(any(Opportunity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CoverLetter coverLetter = CoverLetter.builder().title("Backend Cover Letter").build();
        coverLetter.setId(11L);
        when(coverLetterRepository.findByIdAndUserIdAndWorkspaceId(11L, 1L, WORKSPACE_ID)).thenReturn(Optional.of(coverLetter));

        OpportunityUpdateRequest update = new OpportunityUpdateRequest();
        update.setCoverLetterId(11L);

        OpportunityResponse response = opportunityService.updateOpportunity(4L, update, WORKSPACE_ID);

        assertThat(response.getCoverLetterLibraryId()).isEqualTo(11L);
        assertThat(response.getCoverLetterTitle()).isEqualTo("Backend Cover Letter");
    }

    @Test
    void updateOpportunity_unlinksCoverLetter() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        CoverLetter coverLetter = CoverLetter.builder().title("Backend Cover Letter").build();
        coverLetter.setId(11L);
        Opportunity existing = opportunity(4L, OpportunityStatus.SAVED);
        existing.setCoverLetterLibrary(coverLetter);
        when(opportunityRepository.findByIdAndUserIdAndWorkspaceId(4L, 1L, WORKSPACE_ID))
                .thenReturn(Optional.of(existing));
        when(opportunityRepository.save(any(Opportunity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OpportunityUpdateRequest update = new OpportunityUpdateRequest();
        update.setUnlinkCoverLetter(true);

        OpportunityResponse response = opportunityService.updateOpportunity(4L, update, WORKSPACE_ID);

        assertThat(response.getCoverLetterLibraryId()).isNull();
    }

    @Test
    void deleteOpportunity_softDeletesOpportunity() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        Opportunity existing = opportunity(5L, OpportunityStatus.SAVED);
        when(opportunityRepository.findByIdAndUserIdAndWorkspaceId(5L, 1L, WORKSPACE_ID))
                .thenReturn(Optional.of(existing));
        when(opportunityRepository.save(any(Opportunity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        opportunityService.deleteOpportunity(5L, WORKSPACE_ID);

        verify(opportunityRepository).save(argThat(o -> o.getDeletedAt() != null));
    }

    @Test
    void convertToApplication_createsApplication_andMarksOpportunityApplied() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        Opportunity existing = opportunity(7L, OpportunityStatus.READY_TO_APPLY);
        existing.setJobLink("https://example.com/job");
        existing.setLocation("Remote");
        existing.setSalaryInfo("120k-140k");
        existing.setNotes("Looks promising");
        existing.setSourceType(ApplicationSource.LINKEDIN);
        existing.setSourceUrl("https://linkedin.com/jobs/123");
        existing.setSourceNotes("Found via recruiter post");
        existing.setRequiresCoverLetter(true);
        existing.setRequiresAssessment(false);
        existing.setHasSpecialSteps(true);
        when(opportunityRepository.findByIdAndUserIdAndWorkspaceId(7L, 1L, WORKSPACE_ID))
                .thenReturn(Optional.of(existing));
        when(opportunityRepository.save(any(Opportunity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ApplicationResponse applicationResponse = ApplicationResponse.builder().id(50L).build();
        when(applicationService.addApplication(any(ApplicationRequest.class), eq(WORKSPACE_ID)))
                .thenReturn(applicationResponse);

        ApplicationResponse result = opportunityService.convertToApplication(
                7L, new OpportunityConvertRequest(), WORKSPACE_ID);

        assertThat(result.getId()).isEqualTo(50L);
        verify(applicationService).addApplication(argThat(req ->
                req.getCompanyId().equals(COMPANY_ID)
                        && req.getRole().equals("Backend Engineer")
                        && req.getJobLink().equals("https://example.com/job")
                        && req.getLocation().equals("Remote")
                        && req.getExpectedSalary().equals("120k-140k")
                        && req.getNotes().equals("Looks promising")
                        && req.getSource() == ApplicationSource.LINKEDIN
                        && req.getSourceUrl().equals("https://linkedin.com/jobs/123")
                        && req.getSourceNotes().equals("Found via recruiter post")
                        && Boolean.TRUE.equals(req.getRequiresCoverLetter())
                        && Boolean.FALSE.equals(req.getRequiresAssessment())
                        && Boolean.TRUE.equals(req.getHasSpecialSteps())
        ), eq(WORKSPACE_ID));
        verify(opportunityRepository).save(argThat(o -> o.getStatus() == OpportunityStatus.APPLIED));
        verify(auditLogService).log(eq(currentUser), eq(com.careerflow.audit.AuditAction.OPPORTUNITY_CONVERTED), anyString());
    }

    @Test
    void convertToApplication_explicitSourceInConvertRequest_overridesOpportunitySourceType() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        Opportunity existing = opportunity(11L, OpportunityStatus.READY_TO_APPLY);
        existing.setSourceType(ApplicationSource.LINKEDIN);
        when(opportunityRepository.findByIdAndUserIdAndWorkspaceId(11L, 1L, WORKSPACE_ID))
                .thenReturn(Optional.of(existing));
        when(opportunityRepository.save(any(Opportunity.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(applicationService.addApplication(any(ApplicationRequest.class), eq(WORKSPACE_ID)))
                .thenReturn(ApplicationResponse.builder().id(51L).build());

        OpportunityConvertRequest convertRequest = new OpportunityConvertRequest();
        convertRequest.setSource(ApplicationSource.REFERRAL);

        opportunityService.convertToApplication(11L, convertRequest, WORKSPACE_ID);

        verify(applicationService).addApplication(argThat(req -> req.getSource() == ApplicationSource.REFERRAL), eq(WORKSPACE_ID));
    }

    @Test
    void updateOpportunity_linksResumeFromLibrary() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        Opportunity existing = opportunity(3L, OpportunityStatus.SAVED);
        when(opportunityRepository.findByIdAndUserIdAndWorkspaceId(3L, 1L, WORKSPACE_ID))
                .thenReturn(Optional.of(existing));
        when(opportunityRepository.save(any(Opportunity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Resume resume = Resume.builder().title("SDE Resume").build();
        resume.setId(10L);
        when(resumeRepository.findByIdAndUserIdAndWorkspaceId(10L, 1L, WORKSPACE_ID)).thenReturn(Optional.of(resume));

        OpportunityUpdateRequest update = new OpportunityUpdateRequest();
        update.setResumeId(10L);

        OpportunityResponse response = opportunityService.updateOpportunity(3L, update, WORKSPACE_ID);

        assertThat(response.getResumeLibraryId()).isEqualTo(10L);
        assertThat(response.getResumeTitle()).isEqualTo("SDE Resume");
    }

    @Test
    void convertToApplication_carriesLinkedResumeForward() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        Resume resume = Resume.builder().title("SDE Resume").build();
        resume.setId(10L);
        Opportunity existing = opportunity(7L, OpportunityStatus.READY_TO_APPLY);
        existing.setResumeLibrary(resume);
        when(opportunityRepository.findByIdAndUserIdAndWorkspaceId(7L, 1L, WORKSPACE_ID))
                .thenReturn(Optional.of(existing));
        when(opportunityRepository.save(any(Opportunity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ApplicationResponse applicationResponse = ApplicationResponse.builder().id(50L).build();
        when(applicationService.addApplication(any(ApplicationRequest.class), eq(WORKSPACE_ID)))
                .thenReturn(applicationResponse);

        JobApplication createdApplication = JobApplication.builder().build();
        createdApplication.setId(50L);
        when(applicationRepository.findByIdAndUserIdAndWorkspaceId(50L, 1L, WORKSPACE_ID))
                .thenReturn(Optional.of(createdApplication));

        opportunityService.convertToApplication(7L, new OpportunityConvertRequest(), WORKSPACE_ID);

        assertThat(createdApplication.getResumeLibrary()).isEqualTo(resume);
        verify(applicationRepository).save(createdApplication);
    }

    @Test
    void convertToApplication_throwsConflictException_whenAlreadyApplied() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        Opportunity existing = opportunity(8L, OpportunityStatus.APPLIED);
        when(opportunityRepository.findByIdAndUserIdAndWorkspaceId(8L, 1L, WORKSPACE_ID))
                .thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> opportunityService.convertToApplication(8L, new OpportunityConvertRequest(), WORKSPACE_ID))
                .isInstanceOf(ConflictException.class);

        verify(applicationService, never()).addApplication(any(), anyLong());
    }

    @Test
    void checkDuplicates_flagsSameRequisitionId_evenAcrossDifferentCompanies() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        Opportunity existing = opportunity(20L, OpportunityStatus.SAVED);
        existing.setRequisitionId("REQ-123");
        when(opportunityRepository.findAllByUserIdAndWorkspaceIdAndRequisitionIdIgnoreCaseAndIdNot(1L, WORKSPACE_ID, "REQ-123", -1L))
                .thenReturn(List.of(existing));

        DuplicateCheckRequest request = new DuplicateCheckRequest();
        request.setCompanyId(COMPANY_ID);
        request.setRequisitionId("REQ-123");

        List<DuplicateMatch> matches = opportunityService.checkDuplicates(request, WORKSPACE_ID);

        assertThat(matches).hasSize(1);
        assertThat(matches.get(0).getMatchReason()).isEqualTo("SAME_REQUISITION_ID");
        assertThat(matches.get(0).getOpportunityId()).isEqualTo(20L);
    }

    @Test
    void checkDuplicates_flagsSameCompanyAndRoleTitle() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        Opportunity existing = opportunity(21L, OpportunityStatus.SAVED);
        when(opportunityRepository.findAllByUserIdAndWorkspaceIdAndCompanyIdAndRoleTitleIgnoreCaseAndIdNot(
                1L, WORKSPACE_ID, COMPANY_ID, "Backend Engineer", -1L))
                .thenReturn(List.of(existing));

        DuplicateCheckRequest request = new DuplicateCheckRequest();
        request.setCompanyId(COMPANY_ID);
        request.setRoleTitle("Backend Engineer");

        List<DuplicateMatch> matches = opportunityService.checkDuplicates(request, WORKSPACE_ID);

        assertThat(matches).hasSize(1);
        assertThat(matches.get(0).getMatchReason()).isEqualTo("SAME_ROLE");
    }

    @Test
    void checkDuplicates_flagsSameCompanyAndJobLink() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        Opportunity existing = opportunity(22L, OpportunityStatus.SAVED);
        when(opportunityRepository.findAllByUserIdAndWorkspaceIdAndCompanyIdAndJobLinkIgnoreCaseAndIdNot(
                1L, WORKSPACE_ID, COMPANY_ID, "https://example.com/job", -1L))
                .thenReturn(List.of(existing));

        DuplicateCheckRequest request = new DuplicateCheckRequest();
        request.setCompanyId(COMPANY_ID);
        request.setJobLink("https://example.com/job");

        List<DuplicateMatch> matches = opportunityService.checkDuplicates(request, WORKSPACE_ID);

        assertThat(matches).hasSize(1);
        assertThat(matches.get(0).getMatchReason()).isEqualTo("SAME_JOB_LINK");
    }

    @Test
    void checkDuplicates_deduplicatesSameOpportunityMatchedOnMultipleReasons_keepingHighestPriority() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        Opportunity existing = opportunity(23L, OpportunityStatus.SAVED);
        existing.setRequisitionId("REQ-999");
        when(opportunityRepository.findAllByUserIdAndWorkspaceIdAndRequisitionIdIgnoreCaseAndIdNot(1L, WORKSPACE_ID, "REQ-999", -1L))
                .thenReturn(List.of(existing));
        when(opportunityRepository.findAllByUserIdAndWorkspaceIdAndCompanyIdAndRoleTitleIgnoreCaseAndIdNot(
                1L, WORKSPACE_ID, COMPANY_ID, "Backend Engineer", -1L))
                .thenReturn(List.of(existing));

        DuplicateCheckRequest request = new DuplicateCheckRequest();
        request.setCompanyId(COMPANY_ID);
        request.setRoleTitle("Backend Engineer");
        request.setRequisitionId("REQ-999");

        List<DuplicateMatch> matches = opportunityService.checkDuplicates(request, WORKSPACE_ID);

        assertThat(matches).hasSize(1);
        assertThat(matches.get(0).getMatchReason()).isEqualTo("SAME_REQUISITION_ID");
    }

    @Test
    void checkDuplicates_excludesGivenOpportunityId_whenEditingInPlace() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(opportunityRepository.findAllByUserIdAndWorkspaceIdAndCompanyIdAndRoleTitleIgnoreCaseAndIdNot(
                1L, WORKSPACE_ID, COMPANY_ID, "Backend Engineer", 30L))
                .thenReturn(List.of());

        DuplicateCheckRequest request = new DuplicateCheckRequest();
        request.setCompanyId(COMPANY_ID);
        request.setRoleTitle("Backend Engineer");
        request.setExcludeOpportunityId(30L);

        List<DuplicateMatch> matches = opportunityService.checkDuplicates(request, WORKSPACE_ID);

        assertThat(matches).isEmpty();
        verify(opportunityRepository).findAllByUserIdAndWorkspaceIdAndCompanyIdAndRoleTitleIgnoreCaseAndIdNot(
                1L, WORKSPACE_ID, COMPANY_ID, "Backend Engineer", 30L);
    }

    @Test
    void convertToApplication_throwsConflictException_whenClosed() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        Opportunity existing = opportunity(9L, OpportunityStatus.CLOSED);
        when(opportunityRepository.findByIdAndUserIdAndWorkspaceId(9L, 1L, WORKSPACE_ID))
                .thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> opportunityService.convertToApplication(9L, new OpportunityConvertRequest(), WORKSPACE_ID))
                .isInstanceOf(ConflictException.class);

        verify(applicationService, never()).addApplication(any(), anyLong());
    }
}
