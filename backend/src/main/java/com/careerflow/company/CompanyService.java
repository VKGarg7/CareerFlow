package com.careerflow.company;

import com.careerflow.application.ApplicationService;
import com.careerflow.followup.FollowUpService;
import com.careerflow.audit.AuditAction;
import com.careerflow.audit.AuditLogService;
import com.careerflow.common.PageResponse;
import com.careerflow.common.PaginationHelper;
import com.careerflow.common.SecurityUtils;
import com.careerflow.common.StatusCountsResponse;
import com.careerflow.common.WorkspaceAccessUtils;
import com.careerflow.company.dto.CompanyActivitySummary;
import com.careerflow.company.dto.CompanyRequest;
import com.careerflow.company.dto.CompanyResponse;
import com.careerflow.company.dto.CompanyUpdateRequest;
import com.careerflow.exception.ConflictException;
import com.careerflow.exception.DuplicateResourceException;
import com.careerflow.exception.ResourceNotFoundException;
import com.careerflow.user.User;
import com.careerflow.workspace.Workspace;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Set;

@SuppressWarnings("null")
@Service
@RequiredArgsConstructor
public class CompanyService {

    private static final Set<String> SORTABLE_FIELDS =
            Set.of("name", "industry", "location", "status", "createdAt", "updatedAt");

    private final CompanyRepository companyRepository;
    private final WorkspaceAccessUtils workspaceAccessUtils;
    private final SecurityUtils securityUtils;
    private final AuditLogService auditLogService;
    @Lazy
    private final ApplicationService applicationService;
    @Lazy
    private final FollowUpService followUpService;

    public CompanyResponse addCompany(CompanyRequest request, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        if (companyRepository.existsByWorkspaceIdAndNameIgnoreCase(workspaceId, request.getName()))
            throw new DuplicateResourceException("Company '" + request.getName() + "' already exists");
        Workspace workspace = workspaceAccessUtils.getOwnedWorkspace(workspaceId, user.getId());
        Company company = Company.builder()
                .user(user)
                .workspace(workspace)
                .name(request.getName())
                .website(request.getWebsite())
                .industry(request.getIndustry())
                .location(request.getLocation())
                .description(request.getDescription())
                .notes(request.getNotes())
                .status(request.getStatus() != null ? request.getStatus() : CompanyStatus.TARGETING)
                .priority(request.getPriority())
                .targetReason(request.getTargetReason())
                .hiringStatus(request.getHiringStatus())
                .recruiterLeads(request.getRecruiterLeads())
                .referralNotes(request.getReferralNotes())
                .strategyNotes(request.getStrategyNotes())
                .build();
        company = companyRepository.save(company);
        auditLogService.log(user, AuditAction.COMPANY_CREATED, "Added company " + company.getName());
        return toResponse(company);
    }

    public PageResponse<CompanyResponse> getMyCompanies(
            Long id, String search, CompanyStatus status, String sortBy, String order, int page, int size, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        if (id != null) {
            CompanyResponse single = toResponse(findOwned(id, user.getId(), workspaceId));
            return PageResponse.single(single);
        }
        Pageable pageable = PaginationHelper.build(page, size, sortBy, order, SORTABLE_FIELDS);
        boolean hasSearch = search != null && !search.isBlank();
        Page<Company> results;
        if (status != null && hasSearch) {
            results = companyRepository.findAllByUserIdAndWorkspaceIdAndStatusAndNameContainingIgnoreCase(user.getId(), workspaceId, status, search.trim(), pageable);
        } else if (status != null) {
            results = companyRepository.findAllByUserIdAndWorkspaceIdAndStatus(user.getId(), workspaceId, status, pageable);
        } else if (hasSearch) {
            results = companyRepository.findAllByUserIdAndWorkspaceIdAndNameContainingIgnoreCase(user.getId(), workspaceId, search.trim(), pageable);
        } else {
            results = companyRepository.findAllByUserIdAndWorkspaceId(user.getId(), workspaceId, pageable);
        }
        return PageResponse.of(results.map(this::toResponse));
    }

    public StatusCountsResponse getMyCompanyStats(Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        return StatusCountsResponse.fromGroupedCounts(companyRepository.countByStatusGroupedForUser(user.getId(), workspaceId));
    }

    public Map<Long, Long> getMyApplicationCountsByCompany(Long workspaceId) {
        return applicationService.getMyApplicationCountsByCompany(workspaceId);
    }

    public Map<String, java.util.List<Long>> getCreationTrend(int days, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        java.time.LocalDate today = java.time.LocalDate.now();
        java.util.List<java.time.LocalDate> dayKeys = new java.util.ArrayList<>();
        for (int i = days - 1; i >= 0; i--) dayKeys.add(today.minusDays(i));

        java.time.LocalDateTime since = dayKeys.get(0).atStartOfDay();
        java.util.List<CompanyRepository.DailyStatusCount> rows =
                companyRepository.countByDayAndStatusGroupedForUser(user.getId(), workspaceId, since);

        Map<String, java.util.List<Long>> result = new java.util.LinkedHashMap<>();
        for (CompanyStatus status : CompanyStatus.values()) {
            Map<java.time.LocalDate, Long> perDay = new java.util.HashMap<>();
            for (CompanyRepository.DailyStatusCount row : rows) {
                if (row.getStatus() != status) continue;
                perDay.put(row.getDay().toLocalDate(), row.getTotal());
            }
            long running = companyRepository.countByUserIdAndStatusAndCreatedAtBefore(user.getId(), workspaceId, status, since);
            java.util.List<Long> series = new java.util.ArrayList<>();
            for (java.time.LocalDate day : dayKeys) {
                running += perDay.getOrDefault(day, 0L);
                series.add(running);
            }
            result.put(status.name(), series);
        }
        return result;
    }

    public Map<Long, CompanyActivitySummary> getMyActivitySummary(Long workspaceId) {
        Map<Long, java.time.LocalDate> lastActivity = applicationService.getMyLastActivityByCompany(workspaceId);
        Map<Long, java.time.LocalDate> nextFollowUp = followUpService.getMyNextFollowUpByCompany(workspaceId);

        Map<Long, CompanyActivitySummary> result = new java.util.HashMap<>();
        java.util.Set<Long> companyIds = new java.util.HashSet<>();
        companyIds.addAll(lastActivity.keySet());
        companyIds.addAll(nextFollowUp.keySet());
        for (Long companyId : companyIds) {
            result.put(companyId, new CompanyActivitySummary(lastActivity.get(companyId), nextFollowUp.get(companyId)));
        }
        return result;
    }

    public CompanyResponse updateCompany(Long id, CompanyUpdateRequest request, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        Company company = findOwned(id, user.getId(), workspaceId);

        if (request.getName() != null && !request.getName().isBlank()) {
            if (companyRepository.existsByWorkspaceIdAndNameIgnoreCaseAndIdNot(workspaceId, request.getName(), id))
                throw new DuplicateResourceException("Company '" + request.getName() + "' already exists");
            company.setName(request.getName());
        }
        if (request.getWebsite() != null) company.setWebsite(request.getWebsite());
        if (request.getIndustry() != null) company.setIndustry(request.getIndustry());
        if (request.getLocation() != null) company.setLocation(request.getLocation());
        if (request.getDescription() != null) company.setDescription(request.getDescription());
        if (request.getNotes() != null) company.setNotes(request.getNotes());
        if (request.getStatus() != null) company.setStatus(request.getStatus());
        if (request.getPriority() != null) company.setPriority(request.getPriority());
        if (request.getTargetReason() != null) company.setTargetReason(request.getTargetReason());
        if (request.getHiringStatus() != null) company.setHiringStatus(request.getHiringStatus());
        if (request.getRecruiterLeads() != null) company.setRecruiterLeads(request.getRecruiterLeads());
        if (request.getReferralNotes() != null) company.setReferralNotes(request.getReferralNotes());
        if (request.getStrategyNotes() != null) company.setStrategyNotes(request.getStrategyNotes());

        company = companyRepository.save(company);
        auditLogService.log(user, AuditAction.COMPANY_UPDATED, "Updated company " + company.getName());
        return toResponse(company);
    }

    public void deleteCompany(Long id, boolean force, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        Company company = findOwned(id, user.getId(), workspaceId);
        boolean hasApplications = applicationService.hasApplications(user.getId(), id, workspaceId);
        if (hasApplications && !force)
            throw new ConflictException(
                    "Company '" + company.getName() + "' has existing applications. " +
                    "Pass force=true to delete it along with all associated applications.");
        if (hasApplications) applicationService.deleteAllByCompany(id, workspaceId);
        company.softDelete();
        companyRepository.save(company);
        auditLogService.log(user, AuditAction.COMPANY_DELETED, "Deleted company " + company.getName());
    }

    private Company findOwned(Long companyId, Long userId, Long workspaceId) {
        return companyRepository.findByIdAndUserIdAndWorkspaceId(companyId, userId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found"));
    }

    private CompanyResponse toResponse(Company company) {
        return CompanyResponse.builder()
                .id(company.getId())
                .name(company.getName())
                .website(company.getWebsite())
                .industry(company.getIndustry())
                .location(company.getLocation())
                .description(company.getDescription())
                .notes(company.getNotes())
                .status(company.getStatus())
                .priority(company.getPriority())
                .targetReason(company.getTargetReason())
                .hiringStatus(company.getHiringStatus())
                .recruiterLeads(company.getRecruiterLeads())
                .referralNotes(company.getReferralNotes())
                .strategyNotes(company.getStrategyNotes())
                .createdAt(company.getCreatedAt())
                .updatedAt(company.getUpdatedAt())
                .build();
    }
}
