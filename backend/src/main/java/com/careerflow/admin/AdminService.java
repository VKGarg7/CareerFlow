package com.careerflow.admin;

import com.careerflow.admin.dto.AdminUserResponse;
import com.careerflow.admin.dto.PlatformStatsResponse;
import com.careerflow.application.ApplicationRepository;
import com.careerflow.audit.AuditAction;
import com.careerflow.audit.AuditLogService;
import com.careerflow.common.PageResponse;
import com.careerflow.common.PaginationHelper;
import com.careerflow.common.SecurityUtils;
import com.careerflow.company.CompanyRepository;
import com.careerflow.exception.BadRequestException;
import com.careerflow.exception.ResourceNotFoundException;
import com.careerflow.interview.InterviewRepository;
import com.careerflow.referral.ReferralRequestRepository;
import com.careerflow.user.Role;
import com.careerflow.user.User;
import com.careerflow.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@SuppressWarnings("null")
@Service
@RequiredArgsConstructor
public class AdminService {

    private static final Set<String> SORTABLE_FIELDS = Set.of(
            "firstName", "lastName", "email", "createdAt"
    );

    private final UserRepository userRepository;
    private final ApplicationRepository applicationRepository;
    private final InterviewRepository interviewRepository;
    private final CompanyRepository companyRepository;
    private final ReferralRequestRepository referralRepository;
    private final SecurityUtils securityUtils;
    private final AuditLogService auditLogService;

    public PlatformStatsResponse getPlatformStats() {
        Map<String, Long> applicationsByStatus = applicationRepository.countByStatusGrouped().stream()
                .collect(Collectors.toMap(
                        row -> row.getStatus().name(), row -> row.getTotal(),
                        (a, b) -> a, LinkedHashMap::new));

        Map<String, Long> interviewsByOutcome = interviewRepository.countByOutcomeGrouped().stream()
                .collect(Collectors.toMap(
                        row -> row.getOutcome().name(), row -> row.getTotal(),
                        (a, b) -> a, LinkedHashMap::new));

        Map<String, Long> referralsByStatus = referralRepository.countByStatusGrouped().stream()
                .collect(Collectors.toMap(
                        row -> row.getStatus().name(), row -> row.getTotal(),
                        (a, b) -> a, LinkedHashMap::new));

        return PlatformStatsResponse.builder()
                .totalUsers(userRepository.count())
                .activeUsers(userRepository.countByActiveTrue())
                .totalApplications(applicationRepository.count())
                .totalInterviews(interviewRepository.count())
                .totalCompanies(companyRepository.count())
                .totalReferrals(referralRepository.count())
                .applicationsByStatus(applicationsByStatus)
                .interviewsByOutcome(interviewsByOutcome)
                .referralsByStatus(referralsByStatus)
                .build();
    }

    public PageResponse<AdminUserResponse> getAllUsers(String search, String sortBy, String order, int page, int size) {
        Pageable pageable = PaginationHelper.build(page, size, sortBy, order, SORTABLE_FIELDS);
        Page<User> results = (search != null && !search.isBlank())
                ? userRepository.search(search.trim(), pageable)
                : userRepository.findAllBy(pageable);
        return PageResponse.of(results.map(this::toResponse));
    }

    @Transactional
    public AdminUserResponse setUserActive(Long userId, boolean active) {
        User admin = securityUtils.getCurrentUser();
        User target = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!active && target.getId().equals(admin.getId()))
            throw new BadRequestException("You cannot deactivate your own account");

        target.setActive(active);
        target = userRepository.save(target);
        auditLogService.log(admin,
                active ? AuditAction.USER_ACTIVATED : AuditAction.USER_DEACTIVATED,
                (active ? "Activated " : "Deactivated ") + target.getEmail());
        return toResponse(target);
    }

    @Transactional
    public AdminUserResponse setUserRole(Long userId, Role role) {
        User admin = securityUtils.getCurrentUser();
        User target = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (role != Role.ADMIN && target.getId().equals(admin.getId()))
            throw new BadRequestException("You cannot remove your own admin role");

        target.setRole(role);
        target = userRepository.save(target);
        auditLogService.log(admin, AuditAction.USER_ROLE_CHANGED,
                "Changed " + target.getEmail() + "'s role to " + role);
        return toResponse(target);
    }

    private AdminUserResponse toResponse(User user) {
        return AdminUserResponse.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .role(user.getRole())
                .active(user.isActive())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
