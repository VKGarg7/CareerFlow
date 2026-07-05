package com.careerflow.company;

import com.careerflow.application.ApplicationService;
import com.careerflow.audit.AuditAction;
import com.careerflow.audit.AuditLogService;
import com.careerflow.common.SecurityUtils;
import com.careerflow.common.SortHelper;
import com.careerflow.company.dto.CompanyRequest;
import com.careerflow.company.dto.CompanyResponse;
import com.careerflow.company.dto.CompanyUpdateRequest;
import com.careerflow.exception.ConflictException;
import com.careerflow.exception.DuplicateResourceException;
import com.careerflow.exception.ResourceNotFoundException;
import com.careerflow.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;

@SuppressWarnings("null")
@Service
@RequiredArgsConstructor
public class CompanyService {

    private static final Set<String> SORTABLE_FIELDS =
            Set.of("name", "industry", "location", "status", "createdAt", "updatedAt");

    private final CompanyRepository companyRepository;
    private final SecurityUtils securityUtils;
    private final AuditLogService auditLogService;
    @Lazy
    private final ApplicationService applicationService;

    public CompanyResponse addCompany(CompanyRequest request) {
        User user = securityUtils.getCurrentUser();
        if (companyRepository.existsByUserIdAndNameIgnoreCase(user.getId(), request.getName()))
            throw new DuplicateResourceException("Company '" + request.getName() + "' already exists");
        Company company = Company.builder()
                .user(user)
                .name(request.getName())
                .website(request.getWebsite())
                .industry(request.getIndustry())
                .location(request.getLocation())
                .description(request.getDescription())
                .notes(request.getNotes())
                .status(request.getStatus() != null ? request.getStatus() : CompanyStatus.TARGETING)
                .build();
        company = companyRepository.save(company);
        auditLogService.log(user, AuditAction.COMPANY_CREATED, "Added company " + company.getName());
        return toResponse(company);
    }

    public List<CompanyResponse> getMyCompanies(Long id, String search, String sortBy, String order) {
        User user = securityUtils.getCurrentUser();
        if (id != null) {
            return List.of(toResponse(findOwned(id, user.getId())));
        }
        Sort sort = SortHelper.build(sortBy, order, SORTABLE_FIELDS);
        boolean hasSearch = search != null && !search.isBlank();
        List<Company> results = hasSearch
                ? companyRepository.findAllByUserIdAndNameContainingIgnoreCase(user.getId(), search.trim(), sort)
                : companyRepository.findAllByUserId(user.getId(), sort);
        return results.stream().map(this::toResponse).toList();
    }

    public CompanyResponse updateCompany(Long id, CompanyUpdateRequest request) {
        User user = securityUtils.getCurrentUser();
        Company company = findOwned(id, user.getId());

        if (request.getName() != null && !request.getName().isBlank()) {
            if (companyRepository.existsByUserIdAndNameIgnoreCaseAndIdNot(user.getId(), request.getName(), id))
                throw new DuplicateResourceException("Company '" + request.getName() + "' already exists");
            company.setName(request.getName());
        }
        if (request.getWebsite() != null) company.setWebsite(request.getWebsite());
        if (request.getIndustry() != null) company.setIndustry(request.getIndustry());
        if (request.getLocation() != null) company.setLocation(request.getLocation());
        if (request.getDescription() != null) company.setDescription(request.getDescription());
        if (request.getNotes() != null) company.setNotes(request.getNotes());
        if (request.getStatus() != null) company.setStatus(request.getStatus());

        company = companyRepository.save(company);
        auditLogService.log(user, AuditAction.COMPANY_UPDATED, "Updated company " + company.getName());
        return toResponse(company);
    }

    public void deleteCompany(Long id, boolean force) {
        User user = securityUtils.getCurrentUser();
        Company company = findOwned(id, user.getId());
        boolean hasApplications = applicationService.hasApplications(user.getId(), id);
        if (hasApplications && !force)
            throw new ConflictException(
                    "Company '" + company.getName() + "' has existing applications. " +
                    "Pass force=true to delete it along with all associated applications.");
        if (hasApplications) applicationService.deleteAllByCompany(id);
        company.softDelete();
        companyRepository.save(company);
        auditLogService.log(user, AuditAction.COMPANY_DELETED, "Deleted company " + company.getName());
    }

    private Company findOwned(Long companyId, Long userId) {
        return companyRepository.findByIdAndUserId(companyId, userId)
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
                .createdAt(company.getCreatedAt())
                .updatedAt(company.getUpdatedAt())
                .build();
    }
}
