package com.careerflow.recruiter;

import com.careerflow.exception.BadRequestException;
import com.careerflow.exception.DuplicateResourceException;
import com.careerflow.exception.ResourceNotFoundException;
import com.careerflow.recruiter.dto.RecruiterContactRequest;
import com.careerflow.recruiter.dto.RecruiterContactResponse;
import com.careerflow.recruiter.dto.RecruiterContactUpdateRequest;
import com.careerflow.user.User;
import com.careerflow.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;

@SuppressWarnings("null")
@Service
@RequiredArgsConstructor
public class RecruiterContactService {

    private static final Set<String> SORTABLE_FIELDS = Set.of(
            "name", "company", "status", "lastContactedAt", "createdAt", "updatedAt"
    );

    private final RecruiterContactRepository recruiterRepository;
    private final UserRepository userRepository;

    public RecruiterContactResponse addRecruiter(RecruiterContactRequest request) {
        User user = getCurrentUser();

        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            if (recruiterRepository.existsByUserIdAndEmailIgnoreCase(user.getId(), request.getEmail().trim()))
                throw new DuplicateResourceException(
                        "A recruiter with email '" + request.getEmail().trim() + "' already exists");
        }

        RecruiterContact recruiter = RecruiterContact.builder()
                .user(user)
                .name(request.getName().trim())
                .email(request.getEmail() != null ? request.getEmail().trim() : null)
                .phone(request.getPhone())
                .linkedIn(request.getLinkedIn())
                .company(request.getCompany())
                .jobTitle(request.getJobTitle())
                .status(request.getStatus() != null ? request.getStatus() : RecruiterStatus.NEW)
                .source(request.getSource())
                .lastContactedAt(request.getLastContactedAt())
                .notes(request.getNotes())
                .build();

        return toResponse(recruiterRepository.save(recruiter));
    }

    public List<RecruiterContactResponse> getMyRecruiters(
            Long id, String search, String status, String sortBy, String order) {

        User user = getCurrentUser();

        if (id != null) {
            return List.of(toResponse(findOwned(id, user.getId())));
        }

        if (!SORTABLE_FIELDS.contains(sortBy))
            throw new BadRequestException("Invalid sortBy field. Allowed: " + SORTABLE_FIELDS);

        Sort sort = Sort.by(
                "asc".equalsIgnoreCase(order) ? Sort.Direction.ASC : Sort.Direction.DESC,
                sortBy
        );

        boolean hasSearch = search != null && !search.isBlank();
        RecruiterStatus statusFilter = null;

        if (status != null && !status.isBlank()) {
            try {
                statusFilter = RecruiterStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("Invalid status value: " + status);
            }
        }

        List<RecruiterContact> results;
        if (hasSearch && statusFilter != null) {
            results = recruiterRepository.searchByUserIdAndStatus(user.getId(), statusFilter, search.trim(), sort);
        } else if (hasSearch) {
            results = recruiterRepository.searchByUserId(user.getId(), search.trim(), sort);
        } else if (statusFilter != null) {
            results = recruiterRepository.findAllByUserIdAndStatus(user.getId(), statusFilter, sort);
        } else {
            results = recruiterRepository.findAllByUserId(user.getId(), sort);
        }

        return results.stream().map(this::toResponse).toList();
    }

    public RecruiterContactResponse updateRecruiter(Long id, RecruiterContactUpdateRequest request) {
        User user = getCurrentUser();
        RecruiterContact recruiter = findOwned(id, user.getId());

        if (request.getName() != null && !request.getName().isBlank()) {
            recruiter.setName(request.getName().trim());
        }

        if (request.getEmail() != null) {
            String newEmail = request.getEmail().trim();
            if (!newEmail.isEmpty()) {
                if (recruiterRepository.existsByUserIdAndEmailIgnoreCaseAndIdNot(user.getId(), newEmail, id))
                    throw new DuplicateResourceException(
                            "A recruiter with email '" + newEmail + "' already exists");
                recruiter.setEmail(newEmail);
            } else {
                recruiter.setEmail(null);
            }
        }

        if (request.getPhone() != null) recruiter.setPhone(request.getPhone().isBlank() ? null : request.getPhone());
        if (request.getLinkedIn() != null) recruiter.setLinkedIn(request.getLinkedIn().isBlank() ? null : request.getLinkedIn());
        if (request.getCompany() != null) recruiter.setCompany(request.getCompany().isBlank() ? null : request.getCompany());
        if (request.getJobTitle() != null) recruiter.setJobTitle(request.getJobTitle().isBlank() ? null : request.getJobTitle());
        if (request.getStatus() != null) recruiter.setStatus(request.getStatus());
        if (request.getSource() != null) recruiter.setSource(request.getSource());
        if (request.getNotes() != null) recruiter.setNotes(request.getNotes().isBlank() ? null : request.getNotes());
        if (request.getLastContactedAt() != null) recruiter.setLastContactedAt(request.getLastContactedAt());

        return toResponse(recruiterRepository.save(recruiter));
    }

    public void deleteRecruiter(Long id) {
        User user = getCurrentUser();
        RecruiterContact recruiter = findOwned(id, user.getId());
        recruiterRepository.delete(recruiter);
    }

    private RecruiterContact findOwned(Long recruiterId, Long userId) {
        return recruiterRepository.findByIdAndUserId(recruiterId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Recruiter contact not found"));
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private RecruiterContactResponse toResponse(RecruiterContact r) {
        return RecruiterContactResponse.builder()
                .id(r.getId())
                .name(r.getName())
                .email(r.getEmail())
                .phone(r.getPhone())
                .linkedIn(r.getLinkedIn())
                .company(r.getCompany())
                .jobTitle(r.getJobTitle())
                .status(r.getStatus())
                .source(r.getSource())
                .lastContactedAt(r.getLastContactedAt())
                .notes(r.getNotes())
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .build();
    }
}
