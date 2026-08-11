package com.careerflow.referral;

import com.careerflow.application.ApplicationRepository;
import com.careerflow.application.JobApplication;
import com.careerflow.audit.AuditAction;
import com.careerflow.audit.AuditLogService;
import com.careerflow.common.PageResponse;
import com.careerflow.common.PaginationHelper;
import com.careerflow.common.SecurityUtils;
import com.careerflow.common.StatusCountsResponse;
import com.careerflow.common.WorkspaceAccessUtils;
import com.careerflow.contact.Contact;
import com.careerflow.contact.ContactRepository;
import com.careerflow.exception.BadRequestException;
import com.careerflow.exception.DuplicateResourceException;
import com.careerflow.exception.ResourceNotFoundException;
import com.careerflow.opportunity.Opportunity;
import com.careerflow.opportunity.OpportunityRepository;
import com.careerflow.referral.dto.ReferralContactSummary;
import com.careerflow.referral.dto.ReferralNoteActionRequest;
import com.careerflow.referral.dto.ReferralRequestDto;
import com.careerflow.referral.dto.ReferralResponse;
import com.careerflow.referral.dto.ReferralStatusHistoryResponse;
import com.careerflow.referral.dto.ReferralUpdateRequest;
import com.careerflow.user.User;
import com.careerflow.workspace.Workspace;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
            "targetRole", "status", "requestedDate", "followUpDate", "referralDate", "createdAt", "updatedAt"
    );

    private final ReferralRequestRepository referralRepository;
    private final ReferralStatusHistoryRepository historyRepository;
    private final ContactRepository contactRepository;
    private final OpportunityRepository opportunityRepository;
    private final ApplicationRepository applicationRepository;
    private final WorkspaceAccessUtils workspaceAccessUtils;
    private final SecurityUtils securityUtils;
    private final AuditLogService auditLogService;


    @Transactional
    public ReferralResponse create(ReferralRequestDto req, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        Workspace workspace = workspaceAccessUtils.getOwnedWorkspace(workspaceId, user.getId());
        Contact contact = findOwnedContact(req.getContactId(), user.getId(), workspaceId);
        checkDuplicate(workspaceId, contact.getId(), req.getTargetRole(), null);

        Opportunity opportunity = resolveOpportunity(req.getOpportunityId(), user.getId(), workspaceId);
        JobApplication application = resolveApplication(req.getApplicationId(), user.getId(), workspaceId);

        ReferralStatus initialStatus = req.getStatus() != null ? req.getStatus() : ReferralStatus.PLANNED;

        ReferralRequest referral = ReferralRequest.builder()
                .user(user)
                .workspace(workspace)
                .contact(contact)
                .targetRole(req.getTargetRole().trim())
                .opportunity(opportunity)
                .application(application)
                .jobPostingUrl(blank(req.getJobPostingUrl()))
                .relationshipContext(blank(req.getRelationshipContext()))
                .messageToReferrer(blank(req.getMessageToReferrer()))
                .status(initialStatus)
                .requestedDate(req.getRequestedDate())
                .followUpDate(req.getFollowUpDate())
                .referralDate(req.getReferralDate())
                .proofUrl(blank(req.getProofUrl()))
                .notes(blank(req.getNotes()))
                .build();

        referral = referralRepository.save(referral);

        recordHistory(referral, user, null, initialStatus, null);
        auditLogService.log(user, AuditAction.REFERRAL_CREATED, "Requested referral for " + describe(referral));

        return toResponse(referral, null);
    }

    public PageResponse<ReferralResponse> getMyReferrals(
            String search, String status, String sortBy, String order, int page, int size, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        Pageable pageable = PaginationHelper.build(page, size, sortBy, order, SORTABLE_FIELDS);

        boolean hasSearch = search != null && !search.isBlank();
        ReferralStatus statusFilter = parseStatus(status);

        Page<ReferralRequest> results;
        if (hasSearch && statusFilter != null) {
            results = referralRepository.searchByUserIdAndStatus(user.getId(), workspaceId, statusFilter, search.trim(), pageable);
        } else if (hasSearch) {
            results = referralRepository.searchByUserId(user.getId(), workspaceId, search.trim(), pageable);
        } else if (statusFilter != null) {
            results = referralRepository.findAllByUserIdAndWorkspaceIdAndStatus(user.getId(), workspaceId, statusFilter, pageable);
        } else {
            results = referralRepository.findAllByUserIdAndWorkspaceId(user.getId(), workspaceId, pageable);
        }

        return PageResponse.of(results.map(r -> toResponse(r, null)));
    }

    public StatusCountsResponse getMyReferralStats(Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        return StatusCountsResponse.fromGroupedCounts(referralRepository.countByStatusGroupedForUser(user.getId(), workspaceId));
    }

    @Transactional
    public ReferralResponse update(Long id, ReferralUpdateRequest req, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        ReferralRequest referral = findOwned(id, user.getId(), workspaceId);

        if (req.getContactId() != null) {
            Contact contact = findOwnedContact(req.getContactId(), user.getId(), workspaceId);
            String targetRole = req.getTargetRole() != null && !req.getTargetRole().isBlank()
                    ? req.getTargetRole().trim() : referral.getTargetRole();
            checkDuplicate(workspaceId, contact.getId(), targetRole, id);
            referral.setContact(contact);
        }

        if (req.getTargetRole() != null && !req.getTargetRole().isBlank()) {
            String newRole = req.getTargetRole().trim();
            checkDuplicate(workspaceId, referral.getContact().getId(), newRole, id);
            referral.setTargetRole(newRole);
        }

        if (req.getOpportunityId() != null)
            referral.setOpportunity(req.getOpportunityId() == 0 ? null : resolveOpportunity(req.getOpportunityId(), user.getId(), workspaceId));

        if (req.getApplicationId() != null)
            referral.setApplication(req.getApplicationId() == 0 ? null : resolveApplication(req.getApplicationId(), user.getId(), workspaceId));

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

        if (req.getReferralDate() != null)
            referral.setReferralDate(req.getReferralDate());

        if (req.getProofUrl() != null)
            referral.setProofUrl(req.getProofUrl().isBlank() ? null : req.getProofUrl());

        if (req.getNotes() != null)
            referral.setNotes(req.getNotes().isBlank() ? null : req.getNotes());

        referral = referralRepository.save(referral);
        auditLogService.log(user, AuditAction.REFERRAL_UPDATED, "Updated referral for " + describe(referral));

        List<ReferralStatusHistoryResponse> history = fetchHistory(id, user.getId());
        return toResponse(referral, history);
    }

    public ReferralResponse getById(Long id, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        ReferralRequest referral = findOwned(id, user.getId(), workspaceId);
        return toResponse(referral, fetchHistory(id, user.getId()));
    }

    public void delete(Long id, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        ReferralRequest referral = findOwned(id, user.getId(), workspaceId);
        referral.softDelete();
        referralRepository.save(referral);
        auditLogService.log(user, AuditAction.REFERRAL_DELETED, "Deleted referral for " + describe(referral));
    }

    @Transactional
    public List<ReferralStatusHistoryResponse> manageNote(Long referralId, ReferralNoteActionRequest req, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        String action = req.getAction().toUpperCase();

        switch (action) {
            case "ADD" -> {
                if (req.getNote() == null || req.getNote().isBlank())
                    throw new BadRequestException("Note must not be blank for ADD action");
                ReferralRequest referral = findOwned(referralId, user.getId(), workspaceId);
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

    private ReferralRequest findOwned(Long id, Long userId, Long workspaceId) {
        return referralRepository.findByIdAndUserIdAndWorkspaceId(id, userId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Referral request not found"));
    }

    private Contact findOwnedContact(Long contactId, Long userId, Long workspaceId) {
        return contactRepository.findByIdAndUserIdAndWorkspaceId(contactId, userId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Contact not found"));
    }

    private Opportunity resolveOpportunity(Long opportunityId, Long userId, Long workspaceId) {
        if (opportunityId == null) return null;
        return opportunityRepository.findByIdAndUserIdAndWorkspaceId(opportunityId, userId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Opportunity not found"));
    }

    private JobApplication resolveApplication(Long applicationId, Long userId, Long workspaceId) {
        if (applicationId == null) return null;
        return applicationRepository.findByIdAndUserIdAndWorkspaceId(applicationId, userId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));
    }

    private String describe(ReferralRequest referral) {
        return referral.getTargetRole() + " via " + referral.getContact().getName();
    }

    private void checkDuplicate(Long workspaceId, Long contactId, String role, Long excludeId) {
        if (contactId == null || role == null || role.isBlank()) return;
        boolean exists = excludeId == null
                ? referralRepository.existsByWorkspaceIdAndContactIdAndTargetRoleIgnoreCase(workspaceId, contactId, role)
                : referralRepository.existsByWorkspaceIdAndContactIdAndTargetRoleIgnoreCaseAndIdNot(workspaceId, contactId, role, excludeId);
        if (exists)
            throw new DuplicateResourceException(
                    "A referral request for role '" + role + "' from this contact already exists");
    }

    private void validateStatusTransition(ReferralStatus current, ReferralStatus next) {
        if (current == next) return;

        if (isTerminal(current) && next != ReferralStatus.PLANNED)
            throw new BadRequestException(
                    "Cannot move from '" + current + "' to '" + next
                    + "'. Terminal statuses can only be re-opened to PLANNED.");

        if (next == ReferralStatus.REFERRAL_SUBMITTED
                && current != ReferralStatus.REFERRAL_AGREED)
            throw new BadRequestException("Status can only be set to REFERRAL_SUBMITTED after REFERRAL_AGREED.");
    }

    private boolean isTerminal(ReferralStatus status) {
        return status == ReferralStatus.REFERRAL_DECLINED
                || status == ReferralStatus.NO_RESPONSE
                || status == ReferralStatus.ROLE_CLOSED;
    }

    private ReferralStatus parseStatus(String status) {
        if (status == null || status.isBlank()) return null;
        try {
            return ReferralStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid status value: " + status);
        }
    }

    private String blank(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private ReferralResponse toResponse(ReferralRequest r, List<ReferralStatusHistoryResponse> history) {
        Contact contact = r.getContact();
        return ReferralResponse.builder()
                .id(r.getId())
                .contact(ReferralContactSummary.builder()
                        .id(contact.getId())
                        .name(contact.getName())
                        .email(contact.getEmail())
                        .linkedIn(contact.getLinkedIn())
                        .company(contact.getCompany() != null ? contact.getCompany().getName() : contact.getCompanyName())
                        .jobTitle(contact.getJobTitle())
                        .build())
                .targetRole(r.getTargetRole())
                .opportunityId(r.getOpportunity() != null ? r.getOpportunity().getId() : null)
                .applicationId(r.getApplication() != null ? r.getApplication().getId() : null)
                .jobPostingUrl(r.getJobPostingUrl())
                .relationshipContext(r.getRelationshipContext())
                .messageToReferrer(r.getMessageToReferrer())
                .status(r.getStatus())
                .requestedDate(r.getRequestedDate())
                .followUpDate(r.getFollowUpDate())
                .referralDate(r.getReferralDate())
                .proofUrl(r.getProofUrl())
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
