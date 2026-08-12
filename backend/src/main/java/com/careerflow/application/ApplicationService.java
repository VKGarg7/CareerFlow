package com.careerflow.application;

import com.careerflow.application.dto.ApplicationRequest;
import com.careerflow.application.dto.ApplicationResponse;
import com.careerflow.application.dto.ApplicationStatsResponse;
import com.careerflow.application.dto.ApplicationUpdateRequest;
import com.careerflow.application.dto.DailyTrendItem;
import com.careerflow.application.dto.MonthlyTrendItem;
import com.careerflow.application.dto.SourceAnalysisItem;
import com.careerflow.audit.AuditAction;
import com.careerflow.audit.AuditLogService;
import com.careerflow.common.DocumentValidation;
import com.careerflow.common.MapCollectors;
import com.careerflow.common.PageResponse;
import com.careerflow.common.PaginationHelper;
import com.careerflow.common.SecurityUtils;
import com.careerflow.common.StatusCountsResponse;
import com.careerflow.common.WorkspaceAccessUtils;
import com.careerflow.company.Company;
import com.careerflow.company.CompanyRepository;
import com.careerflow.config.FileStorageService;
import com.careerflow.document.Document;
import com.careerflow.document.DocumentDto;
import com.careerflow.document.DocumentRepository;
import com.careerflow.exception.ResourceNotFoundException;
import com.careerflow.coverletter.CoverLetter;
import com.careerflow.coverletter.CoverLetterRepository;
import com.careerflow.followup.FollowUpRepository;
import com.careerflow.resume.LinkedEntityType;
import com.careerflow.resume.Resume;
import com.careerflow.resume.ResumeLinkService;
import com.careerflow.resume.ResumeRepository;
import com.careerflow.resume.dto.ResumeLinkHistoryResponse;
import com.careerflow.user.User;
import com.careerflow.workspace.Workspace;
import com.careerflow.workspace.WorkspaceRepository;
import com.careerflow.actionitem.ActionableEntityType;
import com.careerflow.timeline.TimelineEventType;
import com.careerflow.timeline.TimelineService;
import com.careerflow.followuprule.FollowUpRuleService;
import com.careerflow.followuprule.FollowUpTriggerEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@SuppressWarnings("null")
@Service
@RequiredArgsConstructor
public class ApplicationService {

    private static final Set<String> SORTABLE_FIELDS =
            Set.of("role", "applicationDate", "status", "source", "createdAt", "updatedAt");

    private final ApplicationRepository applicationRepository;
    private final CompanyRepository companyRepository;
    private final WorkspaceAccessUtils workspaceAccessUtils;
    private final FollowUpRepository followUpRepository;
    private final FileStorageService fileStorageService;
    private final DocumentRepository documentRepository;
    private final SecurityUtils securityUtils;
    private final com.careerflow.user.UserResumeRepository userResumeRepository;
    private final ResumeRepository resumeRepository;
    private final ResumeLinkService resumeLinkService;
    private final CoverLetterRepository coverLetterRepository;
    private final AuditLogService auditLogService;
    private final WorkspaceRepository workspaceRepository;
    private final TimelineService timelineService;
    private final FollowUpRuleService followUpRuleService;

    private static final Set<ApplicationStatus> NEVER_STALE_STATUSES = Set.of(
            ApplicationStatus.REJECTED, ApplicationStatus.JOINED);

    public ApplicationResponse addApplication(ApplicationRequest request, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        Company company = findOwnedCompany(request.getCompanyId(), user.getId(), workspaceId);
        Workspace workspace = workspaceAccessUtils.getOwnedWorkspace(workspaceId, user.getId());

        JobApplication application = JobApplication.builder()
                .user(user)
                .workspace(workspace)
                .company(company)
                .role(request.getRole())
                .jobLink(request.getJobLink())
                .location(request.getLocation())
                .applicationDate(request.getApplicationDate())
                .source(request.getSource())
                .sourceUrl(request.getSourceUrl())
                .sourceNotes(request.getSourceNotes())
                .requiresCoverLetter(Boolean.TRUE.equals(request.getRequiresCoverLetter()))
                .requiresAssessment(Boolean.TRUE.equals(request.getRequiresAssessment()))
                .hasSpecialSteps(Boolean.TRUE.equals(request.getHasSpecialSteps()))
                .status(request.getStatus() != null ? request.getStatus() : ApplicationStatus.APPLIED)
                .expectedSalary(request.getExpectedSalary())
                .deadline(request.getDeadline())
                .notes(request.getNotes())
                .portfolioLink(request.getPortfolioLink())
                .githubLink(request.getGithubLink())
                .linkedinLink(request.getLinkedinLink())
                .questionnaireAnswers(request.getQuestionnaireAnswers())
                .build();

        application = applicationRepository.save(application);
        auditLogService.log(user, AuditAction.APPLICATION_CREATED, "Applied to " + describe(application));
        timelineService.record(user, workspace, ActionableEntityType.APPLICATION, application.getId(),
                describe(application), TimelineEventType.APPLICATION_SUBMITTED, "Application submitted");
        followUpRuleService.onEvent(FollowUpTriggerEvent.AFTER_APPLICATION_SUBMITTED, user, workspace,
                ActionableEntityType.APPLICATION, application.getId(), describe(application));
        return toResponse(application);
    }

    public PageResponse<ApplicationResponse> getMyApplications(
            Long companyId, ApplicationStatus status, String sortBy, String order, int page, int size, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        Pageable pageable = PaginationHelper.build(page, size, sortBy, order, SORTABLE_FIELDS);

        Page<JobApplication> results;
        if (companyId != null && status != null) {
            results = applicationRepository.findAllByUserIdAndWorkspaceIdAndCompanyIdAndStatus(user.getId(), workspaceId, companyId, status, pageable);
        } else if (companyId != null) {
            results = applicationRepository.findAllByUserIdAndWorkspaceIdAndCompanyId(user.getId(), workspaceId, companyId, pageable);
        } else if (status != null) {
            results = applicationRepository.findAllByUserIdAndWorkspaceIdAndStatus(user.getId(), workspaceId, status, pageable);
        } else {
            results = applicationRepository.findAllByUserIdAndWorkspaceId(user.getId(), workspaceId, pageable);
        }

        List<JobApplication> content = results.getContent();
        Map<Long, LocalDate> nearestFollowUps = buildNearestFollowUpMap(content);
        Map<Long, LocalDate> upcomingFollowUps = buildUpcomingFollowUpMap(content);
        int staleThresholdDays = staleThresholdDays(workspaceId, user.getId());
        return PageResponse.of(results.map(a -> toResponse(a, nearestFollowUps.get(a.getId()), upcomingFollowUps.get(a.getId()), staleThresholdDays)));
    }

    public ApplicationStatsResponse getMyApplicationStats(Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        StatusCountsResponse base =
                StatusCountsResponse.fromGroupedCounts(applicationRepository.countByStatusGroupedForUser(user.getId(), workspaceId));

        LocalDate now = LocalDate.now();
        LocalDate prev = now.minusMonths(1);
        Map<String, Long> countsByMonth = MapCollectors.toMap(
                applicationRepository.countByMonthGroupedForUser(user.getId(), workspaceId, prev.withDayOfMonth(1)),
                ApplicationService::yearMonthKey, ApplicationRepository.MonthlyCount::getTotal);

        return ApplicationStatsResponse.builder()
                .total(base.getTotal())
                .byStatus(base.getByStatus())
                .createdThisMonth(countsByMonth.getOrDefault(yearMonthKey(now), 0L))
                .createdLastMonth(countsByMonth.getOrDefault(yearMonthKey(prev), 0L))
                .build();
    }

    public List<String> getMyRoles(Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        return applicationRepository.findDistinctRolesForUser(user.getId(), workspaceId);
    }

    public Map<Long, Long> getMyApplicationCountsByCompany(Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        return MapCollectors.toMap(applicationRepository.countByCompanyGroupedForUser(user.getId(), workspaceId),
                ApplicationRepository.CompanyCount::getCompanyId, ApplicationRepository.CompanyCount::getTotal);
    }

    public Map<Long, LocalDate> getMyLastActivityByCompany(Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        return MapCollectors.toMap(applicationRepository.lastActivityByCompanyGroupedForUser(user.getId(), workspaceId),
                ApplicationRepository.CompanyLastActivity::getCompanyId, ApplicationRepository.CompanyLastActivity::getLastActivity);
    }

    public List<MonthlyTrendItem> getMyMonthlyTrend(Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        LocalDate since = LocalDate.now().withDayOfMonth(1).minusMonths(11);
        Map<String, Long> countsByKey = MapCollectors.toMap(
                applicationRepository.countByMonthGroupedForUser(user.getId(), workspaceId, since),
                ApplicationService::yearMonthKey, ApplicationRepository.MonthlyCount::getTotal);

        List<MonthlyTrendItem> result = new java.util.ArrayList<>();
        LocalDate cursor = since;
        for (int i = 0; i < 12; i++) {
            result.add(MonthlyTrendItem.builder()
                    .year(cursor.getYear())
                    .month(cursor.getMonthValue())
                    .count(countsByKey.getOrDefault(yearMonthKey(cursor), 0L))
                    .build());
            cursor = cursor.plusMonths(1);
        }
        return result;
    }

    private static String yearMonthKey(LocalDate date) {
        return date.getYear() + "-" + date.getMonthValue();
    }

    private static String yearMonthKey(ApplicationRepository.MonthlyCount row) {
        return row.getYear() + "-" + row.getMonth();
    }

    public List<DailyTrendItem> getMyWeeklyTrend(int days, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        int safeDays = days <= 0 ? 14 : Math.min(days, 90);
        LocalDate since = LocalDate.now().minusDays(safeDays - 1L);
        Map<LocalDate, Long> countsByDay = MapCollectors.toMap(
                applicationRepository.countByDayGroupedForUser(user.getId(), workspaceId, since),
                ApplicationRepository.DailyCount::getDay, ApplicationRepository.DailyCount::getTotal);

        List<DailyTrendItem> result = new java.util.ArrayList<>();
        LocalDate cursor = since;
        LocalDate today = LocalDate.now();
        while (!cursor.isAfter(today)) {
            result.add(DailyTrendItem.builder()
                    .date(cursor)
                    .count(countsByDay.getOrDefault(cursor, 0L))
                    .build());
            cursor = cursor.plusDays(1);
        }
        return result;
    }

    public List<ApplicationResponse> getMyUpcomingDeadlines(int withinDays, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        LocalDate today = LocalDate.now();
        LocalDate until = today.plusDays(Math.max(withinDays, 0));
        List<JobApplication> apps = applicationRepository
                .findAllByUserIdAndDeadlineBetweenOrderByDeadlineAsc(user.getId(), workspaceId, today, until);
        Map<Long, LocalDate> nearestFollowUps = buildNearestFollowUpMap(apps);
        Map<Long, LocalDate> upcomingFollowUps = buildUpcomingFollowUpMap(apps);
        return apps.stream()
                .map(a -> toResponse(a, nearestFollowUps.get(a.getId()), upcomingFollowUps.get(a.getId())))
                .toList();
    }

    public List<ApplicationResponse> getStaleApplications(Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        int thresholdDays = staleThresholdDays(workspaceId, user.getId());
        LocalDateTime staleBefore = LocalDateTime.now().minusDays(thresholdDays);
        List<JobApplication> stale = applicationRepository.findStaleCandidates(
                user.getId(), workspaceId, List.copyOf(NEVER_STALE_STATUSES), staleBefore);
        Map<Long, LocalDate> nearestFollowUps = buildNearestFollowUpMap(stale);
        Map<Long, LocalDate> upcomingFollowUps = buildUpcomingFollowUpMap(stale);
        return stale.stream()
                .map(a -> toResponse(a, nearestFollowUps.get(a.getId()), upcomingFollowUps.get(a.getId()), thresholdDays))
                .toList();
    }

    public ApplicationResponse dismissStale(Long id, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        JobApplication application = findOwned(id, user.getId(), workspaceId);
        application = applicationRepository.save(application); // bumps updatedAt so it stops re-flagging until the threshold elapses again
        auditLogService.log(user, AuditAction.STALE_APPLICATION_DISMISSED, "Dismissed stale flag for " + describe(application));
        return toResponse(application);
    }

    public ApplicationResponse markStaleNoResponse(Long id, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        JobApplication application = findOwned(id, user.getId(), workspaceId);
        application.setStatus(ApplicationStatus.REJECTED);
        application = applicationRepository.save(application);
        auditLogService.log(user, AuditAction.STALE_APPLICATION_MARKED_NO_RESPONSE, "Marked no response for " + describe(application));
        return toResponse(application);
    }

    private int staleThresholdDays(Long workspaceId, Long userId) {
        return workspaceRepository.findByIdAndUserId(workspaceId, userId)
                .map(Workspace::getStaleApplicationThresholdDays)
                .filter(d -> d != null && d > 0)
                .orElse(14);
    }

    public List<SourceAnalysisItem> getMySourceAnalysis(Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        return applicationRepository.countBySourceGroupedForUser(user.getId(), workspaceId).stream()
                .map(row -> SourceAnalysisItem.builder()
                        .source(row.getSource())
                        .total(row.getTotal())
                        .interviews(row.getInterviews())
                        .offers(row.getOffers())
                        .build())
                .toList();
    }

    public List<com.careerflow.application.dto.ResumeAnalysisItem> getMyResumeAnalysis(Long workspaceId, String roleCategory) {
        User user = securityUtils.getCurrentUser();
        return applicationRepository.countByResumeGroupedForUser(user.getId(), workspaceId, roleCategory).stream()
                .map(row -> {
                    long total = row.getTotal();
                    return com.careerflow.application.dto.ResumeAnalysisItem.builder()
                        .resumeId(row.getResumeId())
                        .resumeTitle(row.getResumeTitle())
                        .roleCategory(row.getRoleCategory())
                        .total(total)
                        .oaClears(row.getOaClears())
                        .interviews(row.getInterviews())
                        .offers(row.getOffers())
                        .interviewRate(total > 0 ? (double) row.getInterviews() / total : 0)
                        .offerRate(total > 0 ? (double) row.getOffers() / total : 0)
                        .build();
                })
                .toList();
    }

    public ApplicationResponse updateApplication(Long id, ApplicationUpdateRequest request, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        JobApplication application = findOwned(id, user.getId(), workspaceId);
        ApplicationStatus previousStatus = application.getStatus();

        if (request.getCompanyId() != null) {
            Company company = findOwnedCompany(request.getCompanyId(), user.getId(), workspaceId);
            application.setCompany(company);
        }
        if (request.getRole() != null && !request.getRole().isBlank())
            application.setRole(request.getRole());
        if (request.getJobLink() != null)
            application.setJobLink(request.getJobLink());
        if (request.getLocation() != null)
            application.setLocation(request.getLocation());
        if (request.getApplicationDate() != null)
            application.setApplicationDate(request.getApplicationDate());
        if (request.getSource() != null)
            application.setSource(request.getSource());
        if (request.getSourceUrl() != null)
            application.setSourceUrl(request.getSourceUrl());
        if (request.getSourceNotes() != null)
            application.setSourceNotes(request.getSourceNotes());
        if (request.getRequiresCoverLetter() != null)
            application.setRequiresCoverLetter(request.getRequiresCoverLetter());
        if (request.getRequiresAssessment() != null)
            application.setRequiresAssessment(request.getRequiresAssessment());
        if (request.getHasSpecialSteps() != null)
            application.setHasSpecialSteps(request.getHasSpecialSteps());
        if (request.getStatus() != null)
            application.setStatus(request.getStatus());
        if (request.getExpectedSalary() != null)
            application.setExpectedSalary(request.getExpectedSalary());
        if (request.getDeadline() != null)
            application.setDeadline(request.getDeadline());
        if (request.getNotes() != null)
            application.setNotes(request.getNotes());
        if (request.getPortfolioLink() != null)
            application.setPortfolioLink(request.getPortfolioLink());
        if (request.getGithubLink() != null)
            application.setGithubLink(request.getGithubLink());
        if (request.getLinkedinLink() != null)
            application.setLinkedinLink(request.getLinkedinLink());
        if (request.getQuestionnaireAnswers() != null)
            application.setQuestionnaireAnswers(request.getQuestionnaireAnswers());

        application = applicationRepository.save(application);
        auditLogService.log(user, AuditAction.APPLICATION_UPDATED, "Updated application for " + describe(application));
        if (application.getStatus() != previousStatus) {
            timelineService.record(user, application.getWorkspace(), ActionableEntityType.APPLICATION, application.getId(),
                    describe(application), TimelineEventType.APPLICATION_STATUS_CHANGED,
                    previousStatus + " → " + application.getStatus());
            if (application.getStatus() == ApplicationStatus.OFFER_RECEIVED) {
                timelineService.record(user, application.getWorkspace(), ActionableEntityType.APPLICATION, application.getId(),
                        describe(application), TimelineEventType.OFFER_RECEIVED, "Offer received");
                followUpRuleService.onEvent(FollowUpTriggerEvent.AFTER_OFFER_RECEIVED, user, application.getWorkspace(),
                        ActionableEntityType.APPLICATION, application.getId(), describe(application));
            }
        }
        return toResponse(application);
    }

    public void deleteApplication(Long id, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        JobApplication application = findOwned(id, user.getId(), workspaceId);
        application.softDelete();
        applicationRepository.save(application);
        auditLogService.log(user, AuditAction.APPLICATION_DELETED, "Deleted application for " + describe(application));
    }

    @Transactional
    public void deleteAllByCompany(Long companyId, Long workspaceId) {
        applicationRepository.softDeleteAllByCompanyId(companyId, workspaceId, LocalDateTime.now());
    }

    public List<ResumeLinkHistoryResponse> getResumeHistory(Long id, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        findOwned(id, user.getId(), workspaceId);
        return resumeLinkService.getHistoryFor(LinkedEntityType.APPLICATION, id);
    }

    public boolean hasApplications(Long userId, Long companyId, Long workspaceId) {
        return applicationRepository.existsByUserIdAndCompanyIdAndWorkspaceId(userId, companyId, workspaceId);
    }


    public ApplicationResponse uploadDocuments(Long appId, MultipartFile resume,
                                               MultipartFile coverLetter, Long profileResumeDocumentId, Long resumeLibraryId,
                                               Long coverLetterLibraryId, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        JobApplication application = findOwned(appId, user.getId(), workspaceId);

        if (resumeLibraryId != null) {
            Resume libraryResume = resumeRepository.findByIdAndUserIdAndWorkspaceId(resumeLibraryId, user.getId(), workspaceId)
                    .orElseThrow(() -> new ResourceNotFoundException("Resume not found"));
            application.setResume(copyDocument(libraryResume.getDocument()));
            resumeLinkService.linkToApplication(application, libraryResume, user);
        } else if (profileResumeDocumentId != null) {
            if (!userResumeRepository.existsByUserIdAndDocumentId(user.getId(), profileResumeDocumentId))
                throw new ResourceNotFoundException("Profile resume not found");
            Document source = documentRepository.findById(profileResumeDocumentId)
                    .orElseThrow(() -> new ResourceNotFoundException("Document not found"));
            application.setResume(copyDocument(source));
        } else if (resume != null && !resume.isEmpty()) {
            DocumentValidation.validateExtension(resume);
            Document doc = fileStorageService.storeDocument(resume, "application-resumes");
            application.setResume(doc);
        }

        if (coverLetterLibraryId != null) {
            CoverLetter libraryCoverLetter = coverLetterRepository.findByIdAndUserIdAndWorkspaceId(coverLetterLibraryId, user.getId(), workspaceId)
                    .orElseThrow(() -> new ResourceNotFoundException("Cover letter not found"));
            application.setCoverLetter(copyDocument(libraryCoverLetter.getDocument()));
            application.setCoverLetterLibrary(libraryCoverLetter);
        } else if (coverLetter != null && !coverLetter.isEmpty()) {
            DocumentValidation.validateExtension(coverLetter);
            Document doc = fileStorageService.storeDocument(coverLetter, "application-cover-letters");
            application.setCoverLetter(doc);
        }

        applicationRepository.save(application);
        return toResponse(application);
    }

    public ApplicationResponse deleteDocument(Long appId, Long documentId, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        JobApplication application = findOwned(appId, user.getId(), workspaceId);

        if (application.getResume() != null && documentId.equals(application.getResume().getId())) {
            application.setResume(null);
            resumeLinkService.unlinkFromApplication(application, user);
        } else if (application.getCoverLetter() != null && documentId.equals(application.getCoverLetter().getId())) {
            application.setCoverLetter(null);
            application.setCoverLetterLibrary(null);
        } else {
            throw new ResourceNotFoundException("Document not found");
        }

        applicationRepository.save(application);
        return toResponse(application);
    }

    public ResponseEntity<Resource> downloadDocument(Long documentId, boolean inline) {
        User user = securityUtils.getCurrentUser();

        boolean owned = applicationRepository.findByResumeIdAndUserId(documentId, user.getId()).isPresent()
                || applicationRepository.findByCoverLetterIdAndUserId(documentId, user.getId()).isPresent();
        if (!owned) throw new ResourceNotFoundException("Document not found");

        Document doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found"));

        Resource resource = fileStorageService.loadAsResource(doc.getStoredPath());
        String disposition = inline
                ? "inline; filename=\"" + doc.getOriginalName() + "\""
                : "attachment; filename=\"" + doc.getOriginalName() + "\"";
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(doc.getContentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition)
                .body(resource);
    }


    private Document copyDocument(Document source) {
        return documentRepository.save(Document.builder()
                .originalName(source.getOriginalName())
                .storedPath(source.getStoredPath())
                .fileSize(source.getFileSize())
                .contentType(source.getContentType())
                .build());
    }

    private JobApplication findOwned(Long appId, Long userId, Long workspaceId) {
        return applicationRepository.findByIdAndUserIdAndWorkspaceId(appId, userId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));
    }

    private Company findOwnedCompany(Long companyId, Long userId, Long workspaceId) {
        return companyRepository.findByIdAndUserIdAndWorkspaceId(companyId, userId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found"));
    }

    private String describe(JobApplication application) {
        return application.getRole() + " at " + application.getCompany().getName();
    }

    private Map<Long, LocalDate> buildNearestFollowUpMap(List<JobApplication> apps) {
        if (apps.isEmpty()) return Map.of();
        List<Long> ids = apps.stream().map(JobApplication::getId).toList();
        return followUpRepository.findNearestPendingFollowUpDates(ids).stream()
                .collect(Collectors.toMap(row -> (Long) row[0], row -> (LocalDate) row[1]));
    }

    private Map<Long, LocalDate> buildUpcomingFollowUpMap(List<JobApplication> apps) {
        if (apps.isEmpty()) return Map.of();
        List<Long> ids = apps.stream().map(JobApplication::getId).toList();
        return followUpRepository.findNearestUpcomingFollowUpDates(ids, LocalDate.now()).stream()
                .collect(Collectors.toMap(row -> (Long) row[0], row -> (LocalDate) row[1]));
    }

    private ApplicationResponse toResponse(JobApplication app) {
        List<Long> ids = List.of(app.getId());
        LocalDate next = followUpRepository.findNearestPendingFollowUpDates(ids)
                .stream().findFirst().map(r -> (LocalDate) r[1]).orElse(null);
        LocalDate upcoming = followUpRepository.findNearestUpcomingFollowUpDates(ids, LocalDate.now())
                .stream().findFirst().map(r -> (LocalDate) r[1]).orElse(null);
        return toResponse(app, next, upcoming);
    }

    private ApplicationResponse toResponse(JobApplication app, LocalDate nextFollowUpDate, LocalDate nextUpcomingFollowUpDate) {
        int staleThresholdDays = app.getWorkspace() != null
                ? staleThresholdDays(app.getWorkspace().getId(), app.getUser().getId()) : 14;
        return toResponse(app, nextFollowUpDate, nextUpcomingFollowUpDate, staleThresholdDays);
    }

    private ApplicationResponse toResponse(JobApplication app, LocalDate nextFollowUpDate, LocalDate nextUpcomingFollowUpDate, int staleThresholdDays) {
        long daysSinceUpdate = app.getUpdatedAt() != null
                ? java.time.Duration.between(app.getUpdatedAt(), LocalDateTime.now()).toDays() : 0;
        boolean stale = !NEVER_STALE_STATUSES.contains(app.getStatus()) && daysSinceUpdate >= staleThresholdDays;
        return ApplicationResponse.builder()
                .id(app.getId())
                .companyId(app.getCompany().getId())
                .companyName(app.getCompany().getName())
                .role(app.getRole())
                .jobLink(app.getJobLink())
                .location(app.getLocation())
                .applicationDate(app.getApplicationDate())
                .source(app.getSource())
                .sourceUrl(app.getSourceUrl())
                .sourceNotes(app.getSourceNotes())
                .requiresCoverLetter(app.isRequiresCoverLetter())
                .requiresAssessment(app.isRequiresAssessment())
                .hasSpecialSteps(app.isHasSpecialSteps())
                .status(app.getStatus())
                .expectedSalary(app.getExpectedSalary())
                .deadline(app.getDeadline())
                .notes(app.getNotes())
                .resume(toDocumentDto(app.getResume()))
                .coverLetter(toDocumentDto(app.getCoverLetter()))
                .resumeLibraryId(app.getResumeLibrary() != null ? app.getResumeLibrary().getId() : null)
                .resumeTitle(app.getResumeLibrary() != null ? app.getResumeLibrary().getTitle() : null)
                .coverLetterLibraryId(app.getCoverLetterLibrary() != null ? app.getCoverLetterLibrary().getId() : null)
                .coverLetterTitle(app.getCoverLetterLibrary() != null ? app.getCoverLetterLibrary().getTitle() : null)
                .portfolioLink(app.getPortfolioLink())
                .githubLink(app.getGithubLink())
                .linkedinLink(app.getLinkedinLink())
                .questionnaireAnswers(app.getQuestionnaireAnswers())
                .nextFollowUpDate(nextFollowUpDate)
                .nextUpcomingFollowUpDate(nextUpcomingFollowUpDate)
                .stale(stale)
                .daysSinceUpdate(daysSinceUpdate)
                .createdAt(app.getCreatedAt())
                .updatedAt(app.getUpdatedAt())
                .build();
    }

    private DocumentDto toDocumentDto(Document doc) {
        if (doc == null) return null;
        return DocumentDto.builder()
                .id(doc.getId())
                .originalName(doc.getOriginalName())
                .contentType(doc.getContentType())
                .fileSize(doc.getFileSize())
                .uploadedAt(doc.getUploadedAt())
                .build();
    }
}
