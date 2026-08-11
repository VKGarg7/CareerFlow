package com.careerflow.contact;

import com.careerflow.common.PageResponse;
import com.careerflow.common.PaginationHelper;
import com.careerflow.common.SecurityUtils;
import com.careerflow.common.StatusCountsResponse;
import com.careerflow.common.WorkspaceAccessUtils;
import com.careerflow.company.Company;
import com.careerflow.company.CompanyRepository;
import com.careerflow.contact.dto.*;
import com.careerflow.exception.BadRequestException;
import com.careerflow.exception.DuplicateResourceException;
import com.careerflow.exception.ResourceNotFoundException;
import com.careerflow.user.User;
import com.careerflow.workspace.Workspace;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@SuppressWarnings("null")
@Service
@RequiredArgsConstructor
public class ContactService {

    private static final Set<String> SORTABLE_FIELDS = Set.of(
            "name", "companyName", "status", "relationshipType", "lastInteractionDate", "createdAt", "updatedAt"
    );

    private final ContactRepository contactRepository;
    private final ContactNoteRepository noteRepository;
    private final CompanyRepository companyRepository;
    private final WorkspaceAccessUtils workspaceAccessUtils;
    private final SecurityUtils securityUtils;


    public ContactResponse addContact(ContactRequest request, Long workspaceId) {
        User user = securityUtils.getCurrentUser();

        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            if (contactRepository.existsByWorkspaceIdAndEmailIgnoreCase(workspaceId, request.getEmail().trim()))
                throw new DuplicateResourceException(
                        "A contact with email '" + request.getEmail().trim() + "' already exists");
        }

        Workspace workspace = workspaceAccessUtils.getOwnedWorkspace(workspaceId, user.getId());
        Company company = resolveCompany(request.getCompanyId(), user.getId(), workspaceId);

        Contact contact = Contact.builder()
                .user(user)
                .workspace(workspace)
                .name(request.getName().trim())
                .email(request.getEmail() != null ? request.getEmail().trim() : null)
                .phone(request.getPhone())
                .linkedIn(request.getLinkedIn())
                .company(company)
                .companyName(request.getCompanyName())
                .jobTitle(request.getJobTitle())
                .status(request.getStatus() != null ? request.getStatus() : ContactStatus.NEW)
                .relationshipType(request.getRelationshipType())
                .relationshipStrength(request.getRelationshipStrength())
                .source(request.getSource())
                .lastInteractionDate(request.getLastInteractionDate())
                .notes(request.getNotes())
                .build();

        return toSummaryResponse(contactRepository.save(contact), 0);
    }

    public PageResponse<ContactResponse> getMyContacts(
            Long id, String search, String status, String relationshipType,
            String sortBy, String order, int page, int size, Long workspaceId) {

        User user = securityUtils.getCurrentUser();

        if (id != null) {
            Contact c = findOwned(id, user.getId(), workspaceId);
            List<ContactNoteResponse> notes = fetchNotes(id, user.getId());
            ContactResponse single = toDetailResponse(c, notes);
            return PageResponse.single(single);
        }

        Pageable pageable = PaginationHelper.build(page, size, sortBy, order, SORTABLE_FIELDS);
        boolean hasSearch = search != null && !search.isBlank();
        ContactStatus statusFilter = parseStatus(status);
        ContactRelationshipType relationshipTypeFilter = parseRelationshipType(relationshipType);

        Page<Contact> results;
        if (hasSearch && statusFilter != null && relationshipTypeFilter != null) {
            results = contactRepository.searchByUserIdAndStatusAndRelationshipType(user.getId(), workspaceId, statusFilter, relationshipTypeFilter, search.trim(), pageable);
        } else if (hasSearch && statusFilter != null) {
            results = contactRepository.searchByUserIdAndStatus(user.getId(), workspaceId, statusFilter, search.trim(), pageable);
        } else if (hasSearch && relationshipTypeFilter != null) {
            results = contactRepository.searchByUserIdAndRelationshipType(user.getId(), workspaceId, relationshipTypeFilter, search.trim(), pageable);
        } else if (hasSearch) {
            results = contactRepository.searchByUserId(user.getId(), workspaceId, search.trim(), pageable);
        } else if (statusFilter != null && relationshipTypeFilter != null) {
            results = contactRepository.findAllByUserIdAndWorkspaceIdAndStatusAndRelationshipType(user.getId(), workspaceId, statusFilter, relationshipTypeFilter, pageable);
        } else if (statusFilter != null) {
            results = contactRepository.findAllByUserIdAndWorkspaceIdAndStatus(user.getId(), workspaceId, statusFilter, pageable);
        } else if (relationshipTypeFilter != null) {
            results = contactRepository.findAllByUserIdAndWorkspaceIdAndRelationshipType(user.getId(), workspaceId, relationshipTypeFilter, pageable);
        } else {
            results = contactRepository.findAllByUserIdAndWorkspaceId(user.getId(), workspaceId, pageable);
        }

        Map<Long, Integer> noteCounts = noteRepository.countGroupedByContactForUser(user.getId())
                .stream()
                .collect(Collectors.toMap(
                        row -> (Long) row[0],
                        row -> ((Long) row[1]).intValue()
                ));

        return PageResponse.of(results.map(c -> toSummaryResponse(c, noteCounts.getOrDefault(c.getId(), 0))));
    }

    public StatusCountsResponse getMyContactStats(Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        return StatusCountsResponse.fromGroupedCounts(contactRepository.countByStatusGroupedForUser(user.getId(), workspaceId));
    }

    public ContactRelationshipTypeCountsResponse getMyRelationshipTypeStats(Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        return ContactRelationshipTypeCountsResponse.fromGroupedCounts(contactRepository.countByRelationshipTypeGroupedForUser(user.getId(), workspaceId));
    }

    public List<ContactSource> getMySources(Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        return contactRepository.findDistinctSourcesForUser(user.getId(), workspaceId);
    }

    public List<ContactRelationshipType> getRelationshipTypes() {
        return List.of(ContactRelationshipType.values());
    }

    public ContactResponse updateContact(Long id, ContactUpdateRequest request, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        Contact contact = findOwned(id, user.getId(), workspaceId);

        if (request.getName() != null && !request.getName().isBlank())
            contact.setName(request.getName().trim());

        if (request.getEmail() != null) {
            String newEmail = request.getEmail().trim();
            if (!newEmail.isEmpty()) {
                if (contactRepository.existsByWorkspaceIdAndEmailIgnoreCaseAndIdNot(workspaceId, newEmail, id))
                    throw new DuplicateResourceException(
                            "A contact with email '" + newEmail + "' already exists");
                contact.setEmail(newEmail);
            } else {
                contact.setEmail(null);
            }
        }

        if (request.getPhone() != null) contact.setPhone(request.getPhone().isBlank() ? null : request.getPhone());
        if (request.getLinkedIn() != null) contact.setLinkedIn(request.getLinkedIn().isBlank() ? null : request.getLinkedIn());
        if (request.getCompanyId() != null) {
            contact.setCompany(request.getCompanyId() == 0 ? null : resolveCompany(request.getCompanyId(), user.getId(), workspaceId));
        }
        if (request.getCompanyName() != null) contact.setCompanyName(request.getCompanyName().isBlank() ? null : request.getCompanyName());
        if (request.getJobTitle() != null) contact.setJobTitle(request.getJobTitle().isBlank() ? null : request.getJobTitle());
        if (request.getStatus() != null) contact.setStatus(request.getStatus());
        if (request.getRelationshipType() != null) contact.setRelationshipType(request.getRelationshipType());
        if (request.getRelationshipStrength() != null) contact.setRelationshipStrength(request.getRelationshipStrength());
        if (request.getSource() != null) contact.setSource(request.getSource());
        if (request.getNotes() != null) contact.setNotes(request.getNotes().isBlank() ? null : request.getNotes());
        if (request.getLastInteractionDate() != null) contact.setLastInteractionDate(request.getLastInteractionDate());

        contactRepository.save(contact);

        // ── Handle note operation (at most one per request) ───────────────────
        if (request.getAddNote() != null) {
            String content = request.getAddNote().trim();
            if (content.isBlank())
                throw new BadRequestException("Note content cannot be empty");
            ContactNote note = ContactNote.builder()
                    .contact(contact)
                    .user(user)
                    .content(content)
                    .build();
            noteRepository.save(note);
        } else if (request.getDeleteNoteId() != null) {
            ContactNote note = noteRepository
                    .findByIdAndContactIdAndUserId(request.getDeleteNoteId(), id, user.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Note not found"));
            noteRepository.delete(note);
        } else if (request.getEditNote() != null) {
            ContactNoteEditRequest edit = request.getEditNote();
            ContactNote note = noteRepository
                    .findByIdAndContactIdAndUserId(edit.getId(), id, user.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Note not found"));
            note.setContent(edit.getContent().trim());
            noteRepository.save(note);
        }

        List<ContactNoteResponse> notes = fetchNotes(id, user.getId());
        return toDetailResponse(contact, notes);
    }

    public void deleteContact(Long id, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        Contact contact = findOwned(id, user.getId(), workspaceId);
        contact.softDelete();
        contactRepository.save(contact);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Company resolveCompany(Long companyId, Long userId, Long workspaceId) {
        if (companyId == null) return null;
        return companyRepository.findByIdAndUserIdAndWorkspaceId(companyId, userId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found"));
    }

    private List<ContactNoteResponse> fetchNotes(Long contactId, Long userId) {
        Sort sort = Sort.by(Sort.Direction.ASC, "createdAt");
        return noteRepository.findAllByContactIdAndUserId(contactId, userId, sort)
                .stream()
                .map(this::toNoteResponse)
                .toList();
    }

    private Contact findOwned(Long contactId, Long userId, Long workspaceId) {
        return contactRepository.findByIdAndUserIdAndWorkspaceId(contactId, userId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Contact not found"));
    }

    private ContactStatus parseStatus(String status) {
        if (status == null || status.isBlank()) return null;
        try {
            return ContactStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid status value: " + status);
        }
    }

    private ContactRelationshipType parseRelationshipType(String relationshipType) {
        if (relationshipType == null || relationshipType.isBlank()) return null;
        try {
            return ContactRelationshipType.valueOf(relationshipType.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid relationshipType value: " + relationshipType);
        }
    }

    private ContactResponse toSummaryResponse(Contact c, int noteCount) {
        return ContactResponse.builder()
                .id(c.getId())
                .name(c.getName())
                .email(c.getEmail())
                .phone(c.getPhone())
                .linkedIn(c.getLinkedIn())
                .companyId(c.getCompany() != null ? c.getCompany().getId() : null)
                .companyDisplayName(c.getCompany() != null ? c.getCompany().getName() : c.getCompanyName())
                .companyName(c.getCompanyName())
                .jobTitle(c.getJobTitle())
                .status(c.getStatus())
                .relationshipType(c.getRelationshipType())
                .relationshipStrength(c.getRelationshipStrength())
                .source(c.getSource())
                .lastInteractionDate(c.getLastInteractionDate())
                .notes(c.getNotes())
                .noteCount(noteCount)
                .interactionNotes(null)
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }

    private ContactResponse toDetailResponse(Contact c, List<ContactNoteResponse> notes) {
        return ContactResponse.builder()
                .id(c.getId())
                .name(c.getName())
                .email(c.getEmail())
                .phone(c.getPhone())
                .linkedIn(c.getLinkedIn())
                .companyId(c.getCompany() != null ? c.getCompany().getId() : null)
                .companyDisplayName(c.getCompany() != null ? c.getCompany().getName() : c.getCompanyName())
                .companyName(c.getCompanyName())
                .jobTitle(c.getJobTitle())
                .status(c.getStatus())
                .relationshipType(c.getRelationshipType())
                .relationshipStrength(c.getRelationshipStrength())
                .source(c.getSource())
                .lastInteractionDate(c.getLastInteractionDate())
                .notes(c.getNotes())
                .noteCount(notes.size())
                .interactionNotes(notes)
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }

    private ContactNoteResponse toNoteResponse(ContactNote note) {
        boolean edited = note.getUpdatedAt() != null
                && !note.getUpdatedAt().equals(note.getCreatedAt());
        return ContactNoteResponse.builder()
                .id(note.getId())
                .contactId(note.getContact().getId())
                .content(note.getContent())
                .edited(edited)
                .createdAt(note.getCreatedAt())
                .updatedAt(note.getUpdatedAt())
                .build();
    }
}
