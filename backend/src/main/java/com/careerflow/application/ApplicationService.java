package com.careerflow.application;

import com.careerflow.application.dto.ApplicationRequest;
import com.careerflow.application.dto.ApplicationResponse;
import com.careerflow.application.dto.ApplicationUpdateRequest;
import com.careerflow.common.SecurityUtils;
import com.careerflow.common.SortHelper;
import com.careerflow.company.Company;
import com.careerflow.company.CompanyRepository;
import com.careerflow.exception.ResourceNotFoundException;
import com.careerflow.followup.FollowUpRepository;
import com.careerflow.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    private final FollowUpRepository followUpRepository;
    private final SecurityUtils securityUtils;

    public ApplicationResponse addApplication(ApplicationRequest request) {
        User user = securityUtils.getCurrentUser();
        Company company = findOwnedCompany(request.getCompanyId(), user.getId());

        JobApplication application = JobApplication.builder()
                .user(user)
                .company(company)
                .role(request.getRole())
                .applicationDate(request.getApplicationDate())
                .source(request.getSource())
                .status(request.getStatus() != null ? request.getStatus() : ApplicationStatus.APPLIED)
                .expectedSalary(request.getExpectedSalary())
                .notes(request.getNotes())
                .build();

        return toResponse(applicationRepository.save(application));
    }

    public List<ApplicationResponse> getMyApplications(
            Long companyId, ApplicationStatus status, String sortBy, String order) {
        User user = securityUtils.getCurrentUser();
        Sort sort = SortHelper.build(sortBy, order, SORTABLE_FIELDS);

        List<JobApplication> results;
        if (companyId != null && status != null) {
            results = applicationRepository.findAllByUserIdAndCompanyIdAndStatus(user.getId(), companyId, status, sort);
        } else if (companyId != null) {
            results = applicationRepository.findAllByUserIdAndCompanyId(user.getId(), companyId, sort);
        } else if (status != null) {
            results = applicationRepository.findAllByUserIdAndStatus(user.getId(), status, sort);
        } else {
            results = applicationRepository.findAllByUserId(user.getId(), sort);
        }

        Map<Long, LocalDate> nearestFollowUps = buildNearestFollowUpMap(results);
        return results.stream().map(a -> toResponse(a, nearestFollowUps.get(a.getId()))).toList();
    }

    public ApplicationResponse updateApplication(Long id, ApplicationUpdateRequest request) {
        User user = securityUtils.getCurrentUser();
        JobApplication application = findOwned(id, user.getId());

        if (request.getCompanyId() != null) {
            Company company = findOwnedCompany(request.getCompanyId(), user.getId());
            application.setCompany(company);
        }
        if (request.getRole() != null && !request.getRole().isBlank())
            application.setRole(request.getRole());
        if (request.getApplicationDate() != null)
            application.setApplicationDate(request.getApplicationDate());
        if (request.getSource() != null)
            application.setSource(request.getSource());
        if (request.getStatus() != null)
            application.setStatus(request.getStatus());
        if (request.getExpectedSalary() != null)
            application.setExpectedSalary(request.getExpectedSalary());
        if (request.getNotes() != null)
            application.setNotes(request.getNotes());

        return toResponse(applicationRepository.save(application));
    }

    public void deleteApplication(Long id) {
        User user = securityUtils.getCurrentUser();
        JobApplication application = findOwned(id, user.getId());
        application.softDelete();
        applicationRepository.save(application);
    }

    @Transactional
    public void deleteAllByCompany(Long companyId) {
        applicationRepository.softDeleteAllByCompanyId(companyId, LocalDateTime.now());
    }

    public boolean hasApplications(Long userId, Long companyId) {
        return applicationRepository.existsByUserIdAndCompanyId(userId, companyId);
    }

    private JobApplication findOwned(Long appId, Long userId) {
        return applicationRepository.findByIdAndUserId(appId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));
    }

    private Company findOwnedCompany(Long companyId, Long userId) {
        return companyRepository.findByIdAndUserId(companyId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found"));
    }

    private Map<Long, LocalDate> buildNearestFollowUpMap(List<JobApplication> apps) {
        if (apps.isEmpty()) return Map.of();
        List<Long> ids = apps.stream().map(JobApplication::getId).toList();
        return followUpRepository.findNearestPendingFollowUpDates(ids).stream()
                .collect(Collectors.toMap(row -> (Long) row[0], row -> (LocalDate) row[1]));
    }

    private ApplicationResponse toResponse(JobApplication app) {
        return toResponse(app, null);
    }

    private ApplicationResponse toResponse(JobApplication app, LocalDate nextFollowUpDate) {
        return ApplicationResponse.builder()
                .id(app.getId())
                .companyId(app.getCompany().getId())
                .companyName(app.getCompany().getName())
                .role(app.getRole())
                .applicationDate(app.getApplicationDate())
                .source(app.getSource())
                .status(app.getStatus())
                .expectedSalary(app.getExpectedSalary())
                .notes(app.getNotes())
                .nextFollowUpDate(nextFollowUpDate)
                .createdAt(app.getCreatedAt())
                .updatedAt(app.getUpdatedAt())
                .build();
    }
}
