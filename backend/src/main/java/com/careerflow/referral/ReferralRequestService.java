package com.careerflow.referral;

import com.careerflow.common.SecurityUtils;
import com.careerflow.common.SortHelper;
import com.careerflow.exception.BadRequestException;
import com.careerflow.exception.DuplicateResourceException;
import com.careerflow.exception.ResourceNotFoundException;
import com.careerflow.referral.dto.ReferralNoteActionRequest;
import com.careerflow.referral.dto.ReferralRequestDto;
import com.careerflow.referral.dto.ReferralResponse;
import com.careerflow.referral.dto.ReferralStatusHistoryResponse;
import com.careerflow.referral.dto.ReferralUpdateRequest;
import com.careerflow.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@SuppressWarnings("null")
@Service
@RequiredArgsConstructor
public class ReferralRequestService {

    private static final Set<String> SORTABLE_FIELDS = Set.of(
            "referrerName", "referrerCompany", "targetRole",
            "status", "requestedDate", "followUpDate", "createdAt", "updatedAt"
    );

    private final ReferralRequestRepository referralRepository;
    private final ReferralStatusHistoryRepository historyRepository;
    private final SecurityUtils securityUtils;

    // ── CRUD ──────────────────────────────────────────────────────────────────

    @Transactional
    public ReferralResponse create(ReferralRequestDto req) {
        User user = securityUtils.getCurrentUser();
        checkDuplicate(user.getId(), req.getReferrerEmail(), req.getTargetRole(), null);

        ReferralStatus initialStatus = req.getStatus() != null ? req.getStatus() : ReferralStatus.DRAFT;

        ReferralRequest referral = ReferralRequest.builder()
                .user(user)
                .referrerName(req.getReferrerName().trim())
                .referrerEmail(normalizeEmail(req.getReferrerEmail()))
                .referrerLinkedIn(blank(req.getReferrerLinkedIn()))
                .referrerCompany(req.getReferrerCompany().trim())
                .referrerJobTitle(blank(req.getReferrerJobTitle()))
                .targetRole(req.getTargetRole().trim())
                .jobPostingUrl(blank(req.getJobPostingUrl()))
                .relationshipContext(blank(req.getRelationshipContext()))
                .messageToReferrer(blank(req.getMessageToReferrer()))
                .status(initialStatus)
                .requestedDate(req.getRequestedDate())
                .followUpDate(req.getFollowUpDate())
                .notes(blank(req.getNotes()))
                .build();

        referral = referralRepository.save(referral);

        // Record initial status entry
        recordHistory(referral, user, null, initialStatus, null);

        return toResponse(referral, null);
    }

    public List<ReferralResponse> getMyReferrals(String search, String status, String sortBy, String order) {
        User user = securityUtils.getCurrentUser();
        Sort sort = SortHelper.build(sortBy, order, SORTABLE_FIELDS);

        boolean hasSearch = search != null && !search.isBlank();
        ReferralStatus statusFilter = parseStatus(status);

        List<ReferralRequest> results;
        if (hasSearch && statusFilter != null) {
            results = referralRepository.searchByUserIdAndStatus(user.getId(), statusFilter, search.trim(), sort);
        } else if (hasSearch) {
            results = referralRepository.searchByUserId(user.getId(), search.trim(), sort);
        } else if (statusFilter != null) {
            results = referralRepository.findAllByUserIdAndStatus(user.getId(), statusFilter, sort);
        } else {
            results = referralRepository.findAllByUserId(user.getId(), sort);
        }

        // History is null in list responses for performance
        return results.stream().map(r -> toResponse(r, null)).toList();
    }

    @Transactional
    public ReferralResponse update(Long id, ReferralUpdateRequest req) {
        User user = securityUtils.getCurrentUser();
        ReferralRequest referral = findOwned(id, user.getId());

        if (req.getReferrerName() != null && !req.getReferrerName().isBlank())
            referral.setReferrerName(req.getReferrerName().trim());

        if (req.getReferrerEmail() != null) {
            String newEmail = normalizeEmail(req.getReferrerEmail());
            checkDuplicate(user.getId(), newEmail, referral.getTargetRole(), id);
            referral.setReferrerEmail(newEmail);
        }

        if (req.getReferrerLinkedIn() != null)
            referral.setReferrerLinkedIn(req.getReferrerLinkedIn().isBlank() ? null : req.getReferrerLinkedIn());

        if (req.getReferrerCompany() != null && !req.getReferrerCompany().isBlank())
            referral.setReferrerCompany(req.getReferrerCompany().trim());

        if (req.getReferrerJobTitle() != null)
            referral.setReferrerJobTitle(req.getReferrerJobTitle().isBlank() ? null : req.getReferrerJobTitle());

        if (req.getTargetRole() != null && !req.getTargetRole().isBlank()) {
            String newRole = req.getTargetRole().trim();
            checkDuplicate(user.getId(), referral.getReferrerEmail(), newRole, id);
            referral.setTargetRole(newRole);
        }

        if (req.getJobPostingUrl() != null)
            referral.setJobPostingUrl(req.getJobPostingUrl().isBlank() ? null : req.getJobPostingUrl());

        if (req.getRelationshipContext() != null)
            referral.setRelationshipContext(req.getRelationshipContext().isBlank() ? null : req.getRelationshipContext());

        if (req.getMessageToReferrer() != null)
            referral.setMessageToReferrer(req.getMessageToReferrer().isBlank() ? null : req.getMessageToReferrer());

        ReferralStatus previousStatus = referral.getStatus();
        if (req.getStatus() != null && req.getStatus() != previousStatus) {
            validateStatusTransition(previousStatus, req.getStatus());
            referral.setStatus(req.getStatus());
            referral = referralRepository.save(referral);
            recordHistory(referral, user, previousStatus, req.getStatus(), blank(req.getStatusNote()));
        } else {
            referral = referralRepository.save(referral);
        }

        if (req.getRequestedDate() != null)
            referral.setRequestedDate(req.getRequestedDate());

        if (req.getFollowUpDate() != null)
            referral.setFollowUpDate(req.getFollowUpDate());

        if (req.getNotes() != null)
            referral.setNotes(req.getNotes().isBlank() ? null : req.getNotes());

        referral = referralRepository.save(referral);

        List<ReferralStatusHistoryResponse> history = fetchHistory(id, user.getId());
        return toResponse(referral, history);
    }

    public ReferralResponse getById(Long id) {
        User user = securityUtils.getCurrentUser();
        ReferralRequest referral = findOwned(id, user.getId());
        return toResponse(referral, fetchHistory(id, user.getId()));
    }

    public void delete(Long id) {
        User user = securityUtils.getCurrentUser();
        ReferralRequest referral = findOwned(id, user.getId());
        referral.softDelete();
        referralRepository.save(referral);
    }

    @Transactional
    public List<ReferralStatusHistoryResponse> manageNote(Long referralId, ReferralNoteActionRequest req) {
        User user = securityUtils.getCurrentUser();
        String action = req.getAction().toUpperCase();

        switch (action) {
            case "ADD" -> {
                if (req.getNote() == null || req.getNote().isBlank())
                    throw new BadRequestException("Note must not be blank for ADD action");
                ReferralRequest referral = findOwned(referralId, user.getId());
                historyRepository.save(ReferralStatusHistory.builder()
                        .referral(referral)
                        .user(user)
                        .note(req.getNote().trim())
                        .noteOnly(true)
                        .build());
            }
            case "EDIT" -> {
                if (req.getNoteId() == null)
                    throw new BadRequestException("noteId is required for EDIT action");
                if (req.getNote() == null || req.getNote().isBlank())
                    throw new BadRequestException("Note must not be blank for EDIT action");
                ReferralStatusHistory entry = historyRepository
                        .findByIdAndReferralIdAndUserId(req.getNoteId(), referralId, user.getId())
                        .orElseThrow(() -> new ResourceNotFoundException("History entry not found"));
                if (!entry.isNoteOnly())
                    throw new BadRequestException("Only user-added notes can be edited");
                entry.setNote(req.getNote().trim());
                historyRepository.save(entry);
            }
            case "DELETE" -> {
                if (req.getNoteId() == null)
                    throw new BadRequestException("noteId is required for DELETE action");
                ReferralStatusHistory entry = historyRepository
                        .findByIdAndReferralIdAndUserId(req.getNoteId(), referralId, user.getId())
                        .orElseThrow(() -> new ResourceNotFoundException("History entry not found"));
                if (!entry.isNoteOnly())
                    throw new BadRequestException("Only user-added notes can be deleted");
                historyRepository.delete(entry);
            }
            default -> throw new BadRequestException("Invalid action: " + req.getAction() + ". Must be ADD, EDIT, or DELETE");
        }

        return fetchHistory(referralId, user.getId());
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void recordHistory(ReferralRequest referral, User user,
                               ReferralStatus from, ReferralStatus to, String note) {
        historyRepository.save(ReferralStatusHistory.builder()
                .referral(referral)
                .user(user)
                .fromStatus(from)
                .toStatus(to)
                .note(note)
                .noteOnly(false)
                .build());
    }

    private List<ReferralStatusHistoryResponse> fetchHistory(Long referralId, Long userId) {
        Sort sort = Sort.by(Sort.Direction.ASC, "changedAt");
        return historyRepository.findAllByReferralIdAndUserId(referralId, userId, sort)
                .stream().map(this::toHistoryResponse).toList();
    }

    private ReferralRequest findOwned(Long id, Long userId) {
        return referralRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Referral request not found"));
    }

    private void checkDuplicate(Long userId, String email, String role, Long excludeId) {
        if (email == null || email.isBlank() || role == null || role.isBlank()) return;
        boolean exists = excludeId == null
                ? referralRepository.existsByUserIdAndReferrerEmailIgnoreCaseAndTargetRoleIgnoreCase(userId, email, role)
                : referralRepository.existsByUserIdAndReferrerEmailIgnoreCaseAndTargetRoleIgnoreCaseAndIdNot(userId, email, role, excludeId);
        if (exists)
            throw new DuplicateResourceException(
                    "A referral request for role '" + role + "' from '" + email + "' already exists");
    }

    private void validateStatusTransition(ReferralStatus current, ReferralStatus next) {
        if (current == next) return;

        if (isTerminal(current) && next != ReferralStatus.DRAFT)
            throw new BadRequestException(
                    "Cannot move from '" + current + "' to '" + next
                    + "'. Terminal statuses can only be re-opened to DRAFT.");

        if (next == ReferralStatus.REFERRED
                && current != ReferralStatus.REQUESTED
                && current != ReferralStatus.ACKNOWLEDGED)
            throw new BadRequestException("Status can only be set to REFERRED after REQUESTED or ACKNOWLEDGED.");

        if (next == ReferralStatus.INTERVIEWING && current != ReferralStatus.REFERRED)
            throw new BadRequestException("Status can only be set to INTERVIEWING after REFERRED.");

        if (next == ReferralStatus.OFFER_RECEIVED && current != ReferralStatus.INTERVIEWING)
            throw new BadRequestException("Status can only be set to OFFER_RECEIVED after INTERVIEWING.");
    }

    private boolean isTerminal(ReferralStatus status) {
        return status == ReferralStatus.REJECTED
                || status == ReferralStatus.WITHDRAWN
                || status == ReferralStatus.DECLINED;
    }

    private ReferralStatus parseStatus(String status) {
        if (status == null || status.isBlank()) return null;
        try {
            return ReferralStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid status value: " + status);
        }
    }

    private String normalizeEmail(String email) {
        if (email == null) return null;
        String trimmed = email.trim();
        return trimmed.isEmpty() ? null : trimmed.toLowerCase();
    }

    private String blank(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private ReferralResponse toResponse(ReferralRequest r, List<ReferralStatusHistoryResponse> history) {
        return ReferralResponse.builder()
                .id(r.getId())
                .referrerName(r.getReferrerName())
                .referrerEmail(r.getReferrerEmail())
                .referrerLinkedIn(r.getReferrerLinkedIn())
                .referrerCompany(r.getReferrerCompany())
                .referrerJobTitle(r.getReferrerJobTitle())
                .targetRole(r.getTargetRole())
                .jobPostingUrl(r.getJobPostingUrl())
                .relationshipContext(r.getRelationshipContext())
                .messageToReferrer(r.getMessageToReferrer())
                .status(r.getStatus())
                .requestedDate(r.getRequestedDate())
                .followUpDate(r.getFollowUpDate())
                .notes(r.getNotes())
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .statusHistory(history)
                .build();
    }

    private ReferralStatusHistoryResponse toHistoryResponse(ReferralStatusHistory h) {
        return ReferralStatusHistoryResponse.builder()
                .id(h.getId())
                .fromStatus(h.getFromStatus())
                .toStatus(h.getToStatus())
                .changedAt(h.getChangedAt())
                .note(h.getNote())
                .noteOnly(h.isNoteOnly())
                .build();
    }
}
