package com.careerflow.coverletter;

import com.careerflow.application.ApplicationRepository;
import com.careerflow.audit.AuditAction;
import com.careerflow.audit.AuditLogService;
import com.careerflow.common.DocumentValidation;
import com.careerflow.common.PageResponse;
import com.careerflow.common.PaginationHelper;
import com.careerflow.common.SecurityUtils;
import com.careerflow.common.WorkspaceAccessUtils;
import com.careerflow.config.FileStorageService;
import com.careerflow.coverletter.dto.CoverLetterRequest;
import com.careerflow.coverletter.dto.CoverLetterResponse;
import com.careerflow.coverletter.dto.CoverLetterUpdateRequest;
import com.careerflow.document.Document;
import com.careerflow.document.DocumentRepository;
import com.careerflow.exception.ConflictException;
import com.careerflow.exception.ResourceNotFoundException;
import com.careerflow.user.User;
import com.careerflow.workspace.Workspace;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.Set;

@SuppressWarnings("null")
@Service
@RequiredArgsConstructor
public class CoverLetterService {

    private static final Set<String> SORTABLE_FIELDS =
            Set.of("title", "targetRoleCategory", "status", "createdAt", "updatedAt");

    private final CoverLetterRepository coverLetterRepository;
    private final ApplicationRepository applicationRepository;
    private final DocumentRepository documentRepository;
    private final WorkspaceAccessUtils workspaceAccessUtils;
    private final SecurityUtils securityUtils;
    private final FileStorageService fileStorageService;
    private final AuditLogService auditLogService;

    public CoverLetterResponse uploadCoverLetter(MultipartFile file, CoverLetterRequest request, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        Workspace workspace = workspaceAccessUtils.getOwnedWorkspace(workspaceId, user.getId());
        DocumentValidation.validateExtension(file);
        Document document = fileStorageService.storeDocument(file, "coverletter-library");
        CoverLetter coverLetter = CoverLetter.builder()
                .user(user)
                .workspace(workspace)
                .title(request.getTitle())
                .targetRoleCategory(request.getTargetRoleCategory())
                .notes(request.getNotes())
                .status(request.getStatus() != null ? request.getStatus() : CoverLetterStatus.ACTIVE)
                .document(document)
                .build();
        coverLetter = coverLetterRepository.save(coverLetter);
        auditLogService.log(user, AuditAction.COVER_LETTER_CREATED, "Uploaded cover letter " + coverLetter.getTitle());
        return toResponse(coverLetter);
    }

    public PageResponse<CoverLetterResponse> getMyCoverLetters(
            Long id, String search, CoverLetterStatus status, String sortBy, String order, int page, int size, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        if (id != null) {
            CoverLetterResponse single = toResponse(findOwned(id, user.getId(), workspaceId));
            return PageResponse.single(single);
        }
        Pageable pageable = PaginationHelper.build(page, size, sortBy, order, SORTABLE_FIELDS);
        boolean hasSearch = search != null && !search.isBlank();
        Page<CoverLetter> results;
        if (status != null && hasSearch) {
            results = coverLetterRepository.findAllByUserIdAndWorkspaceIdAndStatusAndTitleContainingIgnoreCase(user.getId(), workspaceId, status, search.trim(), pageable);
        } else if (status != null) {
            results = coverLetterRepository.findAllByUserIdAndWorkspaceIdAndStatus(user.getId(), workspaceId, status, pageable);
        } else if (hasSearch) {
            results = coverLetterRepository.findAllByUserIdAndWorkspaceIdAndTitleContainingIgnoreCase(user.getId(), workspaceId, search.trim(), pageable);
        } else {
            results = coverLetterRepository.findAllByUserIdAndWorkspaceId(user.getId(), workspaceId, pageable);
        }
        return PageResponse.of(results.map(this::toResponse));
    }

    public CoverLetterResponse updateCoverLetter(Long id, CoverLetterUpdateRequest request, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        CoverLetter coverLetter = findOwned(id, user.getId(), workspaceId);

        if (request.getTitle() != null && !request.getTitle().isBlank()) coverLetter.setTitle(request.getTitle());
        if (request.getTargetRoleCategory() != null) coverLetter.setTargetRoleCategory(request.getTargetRoleCategory());
        if (request.getNotes() != null) coverLetter.setNotes(request.getNotes());
        if (request.getStatus() != null) coverLetter.setStatus(request.getStatus());

        coverLetter = coverLetterRepository.save(coverLetter);
        auditLogService.log(user, AuditAction.COVER_LETTER_UPDATED, "Updated cover letter " + coverLetter.getTitle());
        return toResponse(coverLetter);
    }

    public void deleteCoverLetter(Long id, boolean force, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        CoverLetter coverLetter = findOwned(id, user.getId(), workspaceId);
        boolean inUse = applicationRepository.existsByCoverLetterLibraryIdAndWorkspaceId(id, workspaceId);
        if (inUse && !force)
            throw new ConflictException(
                    "Cover letter '" + coverLetter.getTitle() + "' has been used in past applications. " +
                    "Pass force=true to delete it anyway; existing applications keep their own copy of the file.");
        coverLetter.softDelete();
        coverLetterRepository.save(coverLetter);
        auditLogService.log(user, AuditAction.COVER_LETTER_DELETED, "Deleted cover letter " + coverLetter.getTitle());
    }

    public ResponseEntity<Resource> downloadDocument(Long documentId, boolean inline) {
        User user = securityUtils.getCurrentUser();
        if (!coverLetterRepository.existsByDocumentIdAndUserId(documentId, user.getId()))
            throw new ResourceNotFoundException("Document not found");

        Document doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found"));

        Resource resource = fileStorageService.loadAsResource(doc.getStoredPath());
        String disposition = inline
                ? "inline; filename=\"" + doc.getOriginalName() + "\""
                : "attachment; filename=\"" + doc.getOriginalName() + "\"";
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(doc.getContentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition)
                .body(resource);
    }

    private CoverLetter findOwned(Long coverLetterId, Long userId, Long workspaceId) {
        return coverLetterRepository.findByIdAndUserIdAndWorkspaceId(coverLetterId, userId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Cover letter not found"));
    }

    private CoverLetterResponse toResponse(CoverLetter coverLetter) {
        Document doc = coverLetter.getDocument();
        return CoverLetterResponse.builder()
                .id(coverLetter.getId())
                .title(coverLetter.getTitle())
                .targetRoleCategory(coverLetter.getTargetRoleCategory())
                .notes(coverLetter.getNotes())
                .status(coverLetter.getStatus())
                .documentId(doc.getId())
                .originalName(doc.getOriginalName())
                .contentType(doc.getContentType())
                .fileSize(doc.getFileSize())
                .createdAt(coverLetter.getCreatedAt())
                .updatedAt(coverLetter.getUpdatedAt())
                .build();
    }
}
