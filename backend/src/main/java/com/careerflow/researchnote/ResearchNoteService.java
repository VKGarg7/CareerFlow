package com.careerflow.researchnote;

import com.careerflow.audit.AuditAction;
import com.careerflow.audit.AuditLogService;
import com.careerflow.common.PageResponse;
import com.careerflow.common.PaginationHelper;
import com.careerflow.common.SecurityUtils;
import com.careerflow.common.WorkspaceAccessUtils;
import com.careerflow.company.Company;
import com.careerflow.company.CompanyRepository;
import com.careerflow.exception.ResourceNotFoundException;
import com.careerflow.researchnote.dto.ResearchNoteRequest;
import com.careerflow.researchnote.dto.ResearchNoteResponse;
import com.careerflow.researchnote.dto.ResearchNoteUpdateRequest;
import com.careerflow.user.User;
import com.careerflow.workspace.Workspace;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ResearchNoteService {

    private static final Set<String> SORTABLE_FIELDS = Set.of("createdAt", "updatedAt", "section");

    private final ResearchNoteRepository researchNoteRepository;
    private final CompanyRepository companyRepository;
    private final WorkspaceAccessUtils workspaceAccessUtils;
    private final SecurityUtils securityUtils;
    private final AuditLogService auditLogService;

    public ResearchNoteResponse addNote(ResearchNoteRequest request, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        Workspace workspace = workspaceAccessUtils.getOwnedWorkspace(workspaceId, user.getId());
        Company company = findOwnedCompany(request.getCompanyId(), user.getId(), workspaceId);

        ResearchNote note = ResearchNote.builder()
                .user(user)
                .workspace(workspace)
                .company(company)
                .section(request.getSection())
                .title(request.getTitle())
                .content(request.getContent())
                .build();
        note = researchNoteRepository.save(note);
        auditLogService.log(user, AuditAction.RESEARCH_NOTE_CREATED, "Added research note for " + company.getName());
        return toResponse(note);
    }

    public List<ResearchNoteResponse> getNotesForCompany(Long companyId, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        findOwnedCompany(companyId, user.getId(), workspaceId);
        return researchNoteRepository.findAllByUserIdAndWorkspaceIdAndCompanyIdOrderByCreatedAtAsc(
                user.getId(), workspaceId, companyId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public PageResponse<ResearchNoteResponse> searchNotes(
            String search, String sortBy, String order, int page, int size, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        Pageable pageable = PaginationHelper.build(page, size, sortBy, order, SORTABLE_FIELDS);
        Page<ResearchNote> results = researchNoteRepository.searchByUserIdAndWorkspaceId(
                user.getId(), workspaceId, search == null ? "" : search.trim(), pageable);
        return PageResponse.of(results.map(this::toResponse));
    }

    public ResearchNoteResponse updateNote(Long id, ResearchNoteUpdateRequest request, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        ResearchNote note = findOwned(id, user.getId(), workspaceId);

        if (request.getSection() != null) note.setSection(request.getSection());
        if (request.getTitle() != null) note.setTitle(request.getTitle());
        if (request.getContent() != null) note.setContent(request.getContent());

        note = researchNoteRepository.save(note);
        auditLogService.log(user, AuditAction.RESEARCH_NOTE_UPDATED, "Updated research note for " + note.getCompany().getName());
        return toResponse(note);
    }

    public void deleteNote(Long id, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        ResearchNote note = findOwned(id, user.getId(), workspaceId);
        note.softDelete();
        researchNoteRepository.save(note);
        auditLogService.log(user, AuditAction.RESEARCH_NOTE_DELETED, "Deleted research note for " + note.getCompany().getName());
    }

    private Company findOwnedCompany(Long companyId, Long userId, Long workspaceId) {
        return companyRepository.findByIdAndUserIdAndWorkspaceId(companyId, userId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found"));
    }

    private ResearchNote findOwned(Long noteId, Long userId, Long workspaceId) {
        return researchNoteRepository.findByIdAndUserIdAndWorkspaceId(noteId, userId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Research note not found"));
    }

    private ResearchNoteResponse toResponse(ResearchNote note) {
        return ResearchNoteResponse.builder()
                .id(note.getId())
                .companyId(note.getCompany().getId())
                .companyName(note.getCompany().getName())
                .section(note.getSection())
                .title(note.getTitle())
                .content(note.getContent())
                .createdAt(note.getCreatedAt())
                .updatedAt(note.getUpdatedAt())
                .build();
    }
}
