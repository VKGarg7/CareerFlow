package com.careerflow.recruiter;

import com.careerflow.common.PageResponse;
import com.careerflow.common.PaginationHelper;
import com.careerflow.common.SecurityUtils;
import com.careerflow.common.StatusCountsResponse;
import com.careerflow.exception.BadRequestException;
import com.careerflow.exception.DuplicateResourceException;
import com.careerflow.exception.ResourceNotFoundException;
import com.careerflow.recruiter.dto.*;
import com.careerflow.user.User;
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
public class RecruiterContactService {

    private static final Set<String> SORTABLE_FIELDS = Set.of(
            "name", "company", "status", "lastContactedAt", "createdAt", "updatedAt"
    );

    private final RecruiterContactRepository recruiterRepository;
    private final RecruiterNoteRepository noteRepository;
    private final SecurityUtils securityUtils;


    public RecruiterContactResponse addRecruiter(RecruiterContactRequest request) {
        User user = securityUtils.getCurrentUser();

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

        return toSummaryResponse(recruiterRepository.save(recruiter), 0);
    }

    public PageResponse<RecruiterContactResponse> getMyRecruiters(
            Long id, String search, String status, String sortBy, String order, int page, int size) {

        User user = securityUtils.getCurrentUser();

        if (id != null) {
            RecruiterContact r = findOwned(id, user.getId());
            List<RecruiterNoteResponse> notes = fetchNotes(id, user.getId());
            RecruiterContactResponse single = toDetailResponse(r, notes);
            return PageResponse.single(single);
        }

        Pageable pageable = PaginationHelper.build(page, size, sortBy, order, SORTABLE_FIELDS);
        boolean hasSearch = search != null && !search.isBlank();
        RecruiterStatus statusFilter = null;

        if (status != null && !status.isBlank()) {
            try {
                statusFilter = RecruiterStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("Invalid status value: " + status);
            }
        }

        Page<RecruiterContact> results;
        if (hasSearch && statusFilter != null) {
            results = recruiterRepository.searchByUserIdAndStatus(user.getId(), statusFilter, search.trim(), pageable);
        } else if (hasSearch) {
            results = recruiterRepository.searchByUserId(user.getId(), search.trim(), pageable);
        } else if (statusFilter != null) {
            results = recruiterRepository.findAllByUserIdAndStatus(user.getId(), statusFilter, pageable);
        } else {
            results = recruiterRepository.findAllByUserId(user.getId(), pageable);
        }

        Map<Long, Integer> noteCounts = noteRepository.countGroupedByRecruiterForUser(user.getId())
                .stream()
                .collect(Collectors.toMap(
                        row -> (Long) row[0],
                        row -> ((Long) row[1]).intValue()
                ));

        return PageResponse.of(results.map(r -> toSummaryResponse(r, noteCounts.getOrDefault(r.getId(), 0))));
    }

    public StatusCountsResponse getMyRecruiterStats() {
        User user = securityUtils.getCurrentUser();
        return StatusCountsResponse.fromGroupedCounts(recruiterRepository.countByStatusGroupedForUser(user.getId()));
    }

    public List<RecruiterSource> getMySources() {
        User user = securityUtils.getCurrentUser();
        return recruiterRepository.findDistinctSourcesForUser(user.getId());
    }

    public RecruiterContactResponse updateRecruiter(Long id, RecruiterContactUpdateRequest request) {
        User user = securityUtils.getCurrentUser();
        RecruiterContact recruiter = findOwned(id, user.getId());

        if (request.getName() != null && !request.getName().isBlank())
            recruiter.setName(request.getName().trim());

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

        recruiterRepository.save(recruiter);

        // ── Handle note operation (at most one per request) ───────────────────
        if (request.getAddNote() != null) {
            String content = request.getAddNote().trim();
            if (content.isBlank())
                throw new BadRequestException("Note content cannot be empty");
            RecruiterNote note = RecruiterNote.builder()
                    .recruiterContact(recruiter)
                    .user(user)
                    .content(content)
                    .build();
            noteRepository.save(note);
        } else if (request.getDeleteNoteId() != null) {
            RecruiterNote note = noteRepository
                    .findByIdAndRecruiterContactIdAndUserId(request.getDeleteNoteId(), id, user.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Note not found"));
            noteRepository.delete(note);
        } else if (request.getEditNote() != null) {
            RecruiterNoteEditRequest edit = request.getEditNote();
            RecruiterNote note = noteRepository
                    .findByIdAndRecruiterContactIdAndUserId(edit.getId(), id, user.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Note not found"));
            note.setContent(edit.getContent().trim());
            noteRepository.save(note);
        }

        List<RecruiterNoteResponse> notes = fetchNotes(id, user.getId());
        return toDetailResponse(recruiter, notes);
    }

    public void deleteRecruiter(Long id) {
        User user = securityUtils.getCurrentUser();
        RecruiterContact recruiter = findOwned(id, user.getId());
        recruiter.softDelete();
        recruiterRepository.save(recruiter);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private List<RecruiterNoteResponse> fetchNotes(Long recruiterId, Long userId) {
        Sort sort = Sort.by(Sort.Direction.ASC, "createdAt");
        return noteRepository.findAllByRecruiterContactIdAndUserId(recruiterId, userId, sort)
                .stream()
                .map(this::toNoteResponse)
                .toList();
    }

    private RecruiterContact findOwned(Long recruiterId, Long userId) {
        return recruiterRepository.findByIdAndUserId(recruiterId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Recruiter contact not found"));
    }

    private RecruiterContactResponse toSummaryResponse(RecruiterContact r, int noteCount) {
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
                .noteCount(noteCount)
                .interactionNotes(null)
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .build();
    }

    private RecruiterContactResponse toDetailResponse(RecruiterContact r, List<RecruiterNoteResponse> notes) {
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
                .noteCount(notes.size())
                .interactionNotes(notes)
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .build();
    }

    private RecruiterNoteResponse toNoteResponse(RecruiterNote note) {
        boolean edited = note.getUpdatedAt() != null
                && !note.getUpdatedAt().equals(note.getCreatedAt());
        return RecruiterNoteResponse.builder()
                .id(note.getId())
                .recruiterId(note.getRecruiterContact().getId())
                .content(note.getContent())
                .edited(edited)
                .createdAt(note.getCreatedAt())
                .updatedAt(note.getUpdatedAt())
                .build();
    }
}
