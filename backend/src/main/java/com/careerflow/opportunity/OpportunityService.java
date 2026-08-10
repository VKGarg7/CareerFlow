package com.careerflow.opportunity;

import com.careerflow.application.ApplicationService;
import com.careerflow.application.dto.ApplicationRequest;
import com.careerflow.application.dto.ApplicationResponse;
import com.careerflow.audit.AuditAction;
import com.careerflow.audit.AuditLogService;
import com.careerflow.common.PageResponse;
import com.careerflow.common.PaginationHelper;
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
import com.careerflow.resume.LinkedEntityType;
import com.careerflow.resume.Resume;
import com.careerflow.resume.ResumeRepository;
import com.careerflow.resume.ResumeLinkService;
import com.careerflow.resume.dto.ResumeLinkHistoryResponse;
import com.careerflow.application.ApplicationRepository;
import com.careerflow.application.JobApplication;
import com.careerflow.user.User;
import com.careerflow.workspace.Workspace;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class OpportunityService {

    private static final Set<String> SORTABLE_FIELDS =
            Set.of("roleTitle", "status", "createdAt", "updatedAt");

    private final OpportunityRepository opportunityRepository;
    private final CompanyRepository companyRepository;
    private final WorkspaceAccessUtils workspaceAccessUtils;
    private final SecurityUtils securityUtils;
    private final AuditLogService auditLogService;
    private final ApplicationService applicationService;
    private final ApplicationRepository applicationRepository;
    private final ResumeRepository resumeRepository;
    private final ResumeLinkService resumeLinkService;
    private final CoverLetterRepository coverLetterRepository;

    public OpportunityResponse addOpportunity(OpportunityRequest request, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        Company company = findOwnedCompany(request.getCompanyId(), user.getId(), workspaceId);
        Workspace workspace = workspaceAccessUtils.getOwnedWorkspace(workspaceId, user.getId());

        Opportunity opportunity = Opportunity.builder()
                .user(user)
                .workspace(workspace)
                .company(company)
                .roleTitle(request.getRoleTitle())
                .jobLink(request.getJobLink())
                .location(request.getLocation())
                .roleCategory(request.getRoleCategory())
                .salaryInfo(request.getSalaryInfo())
                .requisitionId(request.getRequisitionId())
                .notes(request.getNotes())
                .status(request.getStatus() != null ? request.getStatus() : OpportunityStatus.SAVED)
                .sourceType(request.getSourceType())
                .sourceUrl(request.getSourceUrl())
                .sourceNotes(request.getSourceNotes())
                .requiresCoverLetter(Boolean.TRUE.equals(request.getRequiresCoverLetter()))
                .requiresAssessment(Boolean.TRUE.equals(request.getRequiresAssessment()))
                .hasSpecialSteps(Boolean.TRUE.equals(request.getHasSpecialSteps()))
                .portfolioLink(request.getPortfolioLink())
                .githubLink(request.getGithubLink())
                .linkedinLink(request.getLinkedinLink())
                .questionnaireAnswers(request.getQuestionnaireAnswers())
                .build();

        opportunity = opportunityRepository.save(opportunity);
        auditLogService.log(user, AuditAction.OPPORTUNITY_CREATED, "Saved opportunity for " + describe(opportunity));
        return toResponse(opportunity);
    }

    public PageResponse<OpportunityResponse> getMyOpportunities(
            Long id, Long companyId, OpportunityStatus status,
            String sortBy, String order, int page, int size, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        if (id != null) {
            OpportunityResponse single = toResponse(findOwned(id, user.getId(), workspaceId));
            return PageResponse.single(single);
        }
        Pageable pageable = PaginationHelper.build(page, size, sortBy, order, SORTABLE_FIELDS);

        Page<Opportunity> results;
        if (companyId != null && status != null) {
            results = opportunityRepository.findAllByUserIdAndWorkspaceIdAndCompanyIdAndStatus(
                    user.getId(), workspaceId, companyId, status, pageable);
        } else if (companyId != null) {
            results = opportunityRepository.findAllByUserIdAndWorkspaceIdAndCompanyId(
                    user.getId(), workspaceId, companyId, pageable);
        } else if (status != null) {
            results = opportunityRepository.findAllByUserIdAndWorkspaceIdAndStatus(
                    user.getId(), workspaceId, status, pageable);
        } else {
            results = opportunityRepository.findAllByUserIdAndWorkspaceId(user.getId(), workspaceId, pageable);
        }
        return PageResponse.of(results.map(this::toResponse));
    }

    public OpportunityResponse updateOpportunity(Long id, OpportunityUpdateRequest request, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        Opportunity opportunity = findOwned(id, user.getId(), workspaceId);

        if (request.getCompanyId() != null) {
            Company company = findOwnedCompany(request.getCompanyId(), user.getId(), workspaceId);
            opportunity.setCompany(company);
        }
        if (request.getRoleTitle() != null && !request.getRoleTitle().isBlank())
            opportunity.setRoleTitle(request.getRoleTitle());
        if (request.getJobLink() != null) opportunity.setJobLink(request.getJobLink());
        if (request.getLocation() != null) opportunity.setLocation(request.getLocation());
        if (request.getRoleCategory() != null) opportunity.setRoleCategory(request.getRoleCategory());
        if (request.getSalaryInfo() != null) opportunity.setSalaryInfo(request.getSalaryInfo());
        if (request.getRequisitionId() != null) opportunity.setRequisitionId(request.getRequisitionId());
        if (request.getNotes() != null) opportunity.setNotes(request.getNotes());
        if (request.getStatus() != null) opportunity.setStatus(request.getStatus());
        if (request.getSourceType() != null) opportunity.setSourceType(request.getSourceType());
        if (request.getSourceUrl() != null) opportunity.setSourceUrl(request.getSourceUrl());
        if (request.getSourceNotes() != null) opportunity.setSourceNotes(request.getSourceNotes());
        if (request.getRequiresCoverLetter() != null) opportunity.setRequiresCoverLetter(request.getRequiresCoverLetter());
        if (request.getRequiresAssessment() != null) opportunity.setRequiresAssessment(request.getRequiresAssessment());
        if (request.getHasSpecialSteps() != null) opportunity.setHasSpecialSteps(request.getHasSpecialSteps());
        if (request.getPortfolioLink() != null) opportunity.setPortfolioLink(request.getPortfolioLink());
        if (request.getGithubLink() != null) opportunity.setGithubLink(request.getGithubLink());
        if (request.getLinkedinLink() != null) opportunity.setLinkedinLink(request.getLinkedinLink());
        if (request.getQuestionnaireAnswers() != null) opportunity.setQuestionnaireAnswers(request.getQuestionnaireAnswers());

        if (Boolean.TRUE.equals(request.getUnlinkResume())) {
            resumeLinkService.unlinkFromOpportunity(opportunity, user);
        } else if (request.getResumeId() != null) {
            Resume resume = resumeRepository.findByIdAndUserIdAndWorkspaceId(request.getResumeId(), user.getId(), workspaceId)
                    .orElseThrow(() -> new ResourceNotFoundException("Resume not found"));
            resumeLinkService.linkToOpportunity(opportunity, resume, user);
        }

        if (Boolean.TRUE.equals(request.getUnlinkCoverLetter())) {
            opportunity.setCoverLetterLibrary(null);
        } else if (request.getCoverLetterId() != null) {
            CoverLetter coverLetter = coverLetterRepository.findByIdAndUserIdAndWorkspaceId(request.getCoverLetterId(), user.getId(), workspaceId)
                    .orElseThrow(() -> new ResourceNotFoundException("Cover letter not found"));
            opportunity.setCoverLetterLibrary(coverLetter);
        }

        opportunity = opportunityRepository.save(opportunity);
        auditLogService.log(user, AuditAction.OPPORTUNITY_UPDATED, "Updated opportunity for " + describe(opportunity));
        return toResponse(opportunity);
    }

    public List<ResumeLinkHistoryResponse> getResumeHistory(Long id, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        findOwned(id, user.getId(), workspaceId);
        return resumeLinkService.getHistoryFor(LinkedEntityType.OPPORTUNITY, id);
    }

    public void deleteOpportunity(Long id, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        Opportunity opportunity = findOwned(id, user.getId(), workspaceId);
        opportunity.softDelete();
        opportunityRepository.save(opportunity);
        auditLogService.log(user, AuditAction.OPPORTUNITY_DELETED, "Deleted opportunity for " + describe(opportunity));
    }

    public ApplicationResponse convertToApplication(Long id, OpportunityConvertRequest request, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        Opportunity opportunity = findOwned(id, user.getId(), workspaceId);

        if (opportunity.getStatus() == OpportunityStatus.APPLIED || opportunity.getStatus() == OpportunityStatus.CLOSED)
            throw new ConflictException("Opportunity has already been applied or closed");

        ApplicationRequest applicationRequest = new ApplicationRequest();
        applicationRequest.setCompanyId(opportunity.getCompany().getId());
        applicationRequest.setRole(opportunity.getRoleTitle());
        applicationRequest.setJobLink(opportunity.getJobLink());
        applicationRequest.setLocation(opportunity.getLocation());
        applicationRequest.setExpectedSalary(opportunity.getSalaryInfo());
        applicationRequest.setNotes(opportunity.getNotes());
        applicationRequest.setApplicationDate(request.getApplicationDate());
        applicationRequest.setDeadline(request.getDeadline());
        applicationRequest.setSource(request.getSource() != null ? request.getSource() : opportunity.getSourceType());
        applicationRequest.setSourceUrl(opportunity.getSourceUrl());
        applicationRequest.setSourceNotes(opportunity.getSourceNotes());
        applicationRequest.setRequiresCoverLetter(opportunity.isRequiresCoverLetter());
        applicationRequest.setRequiresAssessment(opportunity.isRequiresAssessment());
        applicationRequest.setHasSpecialSteps(opportunity.isHasSpecialSteps());
        applicationRequest.setPortfolioLink(opportunity.getPortfolioLink());
        applicationRequest.setGithubLink(opportunity.getGithubLink());
        applicationRequest.setLinkedinLink(opportunity.getLinkedinLink());
        applicationRequest.setQuestionnaireAnswers(opportunity.getQuestionnaireAnswers());

        ApplicationResponse applicationResponse = applicationService.addApplication(applicationRequest, workspaceId);

        if (opportunity.getResumeLibrary() != null || opportunity.getCoverLetterLibrary() != null) {
            JobApplication createdApplication = applicationRepository
                    .findByIdAndUserIdAndWorkspaceId(applicationResponse.getId(), user.getId(), workspaceId)
                    .orElseThrow(() -> new ResourceNotFoundException("Application not found"));
            if (opportunity.getResumeLibrary() != null)
                resumeLinkService.linkToApplication(createdApplication, opportunity.getResumeLibrary(), user);
            if (opportunity.getCoverLetterLibrary() != null)
                createdApplication.setCoverLetterLibrary(opportunity.getCoverLetterLibrary());
            applicationRepository.save(createdApplication);
        }

        opportunity.setStatus(OpportunityStatus.APPLIED);
        opportunityRepository.save(opportunity);
        auditLogService.log(user, AuditAction.OPPORTUNITY_CONVERTED,
                "Converted opportunity to application for " + describe(opportunity));

        return applicationResponse;
    }

    public List<DuplicateMatch> checkDuplicates(DuplicateCheckRequest request, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        Long excludeId = request.getExcludeOpportunityId() != null ? request.getExcludeOpportunityId() : -1L;
        Map<Long, DuplicateMatch> matches = new LinkedHashMap<>();

        if (request.getRequisitionId() != null && !request.getRequisitionId().isBlank()) {
            for (Opportunity o : opportunityRepository.findAllByUserIdAndWorkspaceIdAndRequisitionIdIgnoreCaseAndIdNot(
                    user.getId(), workspaceId, request.getRequisitionId().trim(), excludeId)) {
                matches.putIfAbsent(o.getId(), toDuplicateMatch(o, "SAME_REQUISITION_ID"));
            }
        }
        if (request.getJobLink() != null && !request.getJobLink().isBlank()) {
            for (Opportunity o : opportunityRepository.findAllByUserIdAndWorkspaceIdAndCompanyIdAndJobLinkIgnoreCaseAndIdNot(
                    user.getId(), workspaceId, request.getCompanyId(), request.getJobLink().trim(), excludeId)) {
                matches.putIfAbsent(o.getId(), toDuplicateMatch(o, "SAME_JOB_LINK"));
            }
        }
        if (request.getRoleTitle() != null && !request.getRoleTitle().isBlank()) {
            for (Opportunity o : opportunityRepository.findAllByUserIdAndWorkspaceIdAndCompanyIdAndRoleTitleIgnoreCaseAndIdNot(
                    user.getId(), workspaceId, request.getCompanyId(), request.getRoleTitle().trim(), excludeId)) {
                matches.putIfAbsent(o.getId(), toDuplicateMatch(o, "SAME_ROLE"));
            }
        }

        return new ArrayList<>(matches.values());
    }

    private DuplicateMatch toDuplicateMatch(Opportunity opportunity, String reason) {
        return DuplicateMatch.builder()
                .opportunityId(opportunity.getId())
                .roleTitle(opportunity.getRoleTitle())
                .companyName(opportunity.getCompany().getName())
                .matchReason(reason)
                .build();
    }

    private Opportunity findOwned(Long opportunityId, Long userId, Long workspaceId) {
        return opportunityRepository.findByIdAndUserIdAndWorkspaceId(opportunityId, userId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Opportunity not found"));
    }

    private Company findOwnedCompany(Long companyId, Long userId, Long workspaceId) {
        return companyRepository.findByIdAndUserIdAndWorkspaceId(companyId, userId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found"));
    }

    private String describe(Opportunity opportunity) {
        return opportunity.getRoleTitle() + " at " + opportunity.getCompany().getName();
    }

    private OpportunityResponse toResponse(Opportunity opportunity) {
        return OpportunityResponse.builder()
                .id(opportunity.getId())
                .companyId(opportunity.getCompany().getId())
                .companyName(opportunity.getCompany().getName())
                .roleTitle(opportunity.getRoleTitle())
                .jobLink(opportunity.getJobLink())
                .location(opportunity.getLocation())
                .roleCategory(opportunity.getRoleCategory())
                .salaryInfo(opportunity.getSalaryInfo())
                .requisitionId(opportunity.getRequisitionId())
                .notes(opportunity.getNotes())
                .status(opportunity.getStatus())
                .sourceType(opportunity.getSourceType())
                .sourceUrl(opportunity.getSourceUrl())
                .sourceNotes(opportunity.getSourceNotes())
                .requiresCoverLetter(opportunity.isRequiresCoverLetter())
                .requiresAssessment(opportunity.isRequiresAssessment())
                .hasSpecialSteps(opportunity.isHasSpecialSteps())
                .resumeLibraryId(opportunity.getResumeLibrary() != null ? opportunity.getResumeLibrary().getId() : null)
                .resumeTitle(opportunity.getResumeLibrary() != null ? opportunity.getResumeLibrary().getTitle() : null)
                .coverLetterLibraryId(opportunity.getCoverLetterLibrary() != null ? opportunity.getCoverLetterLibrary().getId() : null)
                .coverLetterTitle(opportunity.getCoverLetterLibrary() != null ? opportunity.getCoverLetterLibrary().getTitle() : null)
                .portfolioLink(opportunity.getPortfolioLink())
                .githubLink(opportunity.getGithubLink())
                .linkedinLink(opportunity.getLinkedinLink())
                .questionnaireAnswers(opportunity.getQuestionnaireAnswers())
                .createdAt(opportunity.getCreatedAt())
                .updatedAt(opportunity.getUpdatedAt())
                .build();
    }
}
