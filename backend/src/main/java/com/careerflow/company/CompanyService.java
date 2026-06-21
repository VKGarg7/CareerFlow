package com.careerflow.company;

import com.careerflow.company.dto.CompanyRequest;
import com.careerflow.company.dto.CompanyResponse;
import com.careerflow.exception.DuplicateResourceException;
import com.careerflow.exception.ResourceNotFoundException;
import com.careerflow.user.User;
import com.careerflow.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;

@SuppressWarnings("null")
@Service
@RequiredArgsConstructor
public class CompanyService {

    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;

    public CompanyResponse addCompany(CompanyRequest request) {
        User user = getCurrentUser();
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
        return toResponse(companyRepository.save(company));
    }

    public List<CompanyResponse> getMyCompanies(Long id) {
        User user = getCurrentUser();
        if (id != null) {
            return List.of(toResponse(findOwned(id, user.getId())));
        }
        return companyRepository.findAllByUserIdOrderByCreatedAtDesc(user.getId())
                .stream().map(this::toResponse).toList();
    }

    public CompanyResponse updateCompany(Long id, CompanyRequest request) {
        User user = getCurrentUser();
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

        return toResponse(companyRepository.save(company));
    }

    public void deleteCompany(Long id) {
        User user = getCurrentUser();
        Company company = findOwned(id, user.getId());
        companyRepository.delete(company);
    }

    private Company findOwned(Long companyId, Long userId) {
        return companyRepository.findByIdAndUserId(companyId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found"));
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
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
