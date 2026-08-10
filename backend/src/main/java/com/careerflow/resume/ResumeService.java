package com.careerflow.resume;

import com.careerflow.application.ApplicationRepository;
import com.careerflow.audit.AuditAction;
import com.careerflow.audit.AuditLogService;
import com.careerflow.common.DocumentValidation;
import com.careerflow.common.PageResponse;
import com.careerflow.common.PaginationHelper;
import com.careerflow.common.SecurityUtils;
import com.careerflow.common.WorkspaceAccessUtils;
import com.careerflow.config.FileStorageService;
import com.careerflow.document.Document;
import com.careerflow.document.DocumentRepository;
import com.careerflow.exception.ConflictException;
import com.careerflow.exception.ResourceNotFoundException;
import com.careerflow.resume.dto.ResumeRequest;
import com.careerflow.resume.dto.ResumeResponse;
import com.careerflow.resume.dto.ResumeUpdateRequest;
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
public class ResumeService {

    private static final Set<String> SORTABLE_FIELDS =
            Set.of("title", "versionTag", "targetRoleCategory", "status", "createdAt", "updatedAt");

    private final ResumeRepository resumeRepository;
    private final ApplicationRepository applicationRepository;
    private final DocumentRepository documentRepository;
    private final WorkspaceAccessUtils workspaceAccessUtils;
    private final SecurityUtils securityUtils;
    private final FileStorageService fileStorageService;
    private final AuditLogService auditLogService;

    public ResumeResponse uploadResume(MultipartFile file, ResumeRequest request, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        Workspace workspace = workspaceAccessUtils.getOwnedWorkspace(workspaceId, user.getId());
        DocumentValidation.validateExtension(file);
        Document document = fileStorageService.storeDocument(file, "resume-library");
        Resume resume = Resume.builder()
                .user(user)
                .workspace(workspace)
                .title(request.getTitle())
                .versionTag(request.getVersionTag())
                .targetRoleCategory(request.getTargetRoleCategory())
                .notes(request.getNotes())
                .status(request.getStatus() != null ? request.getStatus() : ResumeStatus.ACTIVE)
                .document(document)
                .build();
        resume = resumeRepository.save(resume);
        auditLogService.log(user, AuditAction.RESUME_CREATED, "Uploaded resume " + resume.getTitle());
        return toResponse(resume);
    }

    public PageResponse<ResumeResponse> getMyResumes(
            Long id, String search, ResumeStatus status, String sortBy, String order, int page, int size, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        if (id != null) {
            ResumeResponse single = toResponse(findOwned(id, user.getId(), workspaceId));
            return PageResponse.single(single);
        }
        Pageable pageable = PaginationHelper.build(page, size, sortBy, order, SORTABLE_FIELDS);
        boolean hasSearch = search != null && !search.isBlank();
        Page<Resume> results;
        if (status != null && hasSearch) {
            results = resumeRepository.findAllByUserIdAndWorkspaceIdAndStatusAndTitleContainingIgnoreCase(user.getId(), workspaceId, status, search.trim(), pageable);
        } else if (status != null) {
            results = resumeRepository.findAllByUserIdAndWorkspaceIdAndStatus(user.getId(), workspaceId, status, pageable);
        } else if (hasSearch) {
            results = resumeRepository.findAllByUserIdAndWorkspaceIdAndTitleContainingIgnoreCase(user.getId(), workspaceId, search.trim(), pageable);
        } else {
            results = resumeRepository.findAllByUserIdAndWorkspaceId(user.getId(), workspaceId, pageable);
        }
        return PageResponse.of(results.map(this::toResponse));
    }

    public ResumeResponse updateResume(Long id, ResumeUpdateRequest request, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        Resume resume = findOwned(id, user.getId(), workspaceId);

        if (request.getTitle() != null && !request.getTitle().isBlank()) resume.setTitle(request.getTitle());
        if (request.getVersionTag() != null) resume.setVersionTag(request.getVersionTag());
        if (request.getTargetRoleCategory() != null) resume.setTargetRoleCategory(request.getTargetRoleCategory());
        if (request.getNotes() != null) resume.setNotes(request.getNotes());
        if (request.getStatus() != null) resume.setStatus(request.getStatus());

        resume = resumeRepository.save(resume);
        auditLogService.log(user, AuditAction.RESUME_UPDATED, "Updated resume " + resume.getTitle());
        return toResponse(resume);
    }

    public void deleteResume(Long id, boolean force, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        Resume resume = findOwned(id, user.getId(), workspaceId);
        boolean inUse = applicationRepository.existsByResumeLibraryIdAndWorkspaceId(id, workspaceId);
        if (inUse && !force)
            throw new ConflictException(
                    "Resume '" + resume.getTitle() + "' has been used in past applications. " +
                    "Pass force=true to delete it anyway; existing applications keep their own copy of the file.");
        resume.softDelete();
        resumeRepository.save(resume);
        auditLogService.log(user, AuditAction.RESUME_DELETED, "Deleted resume " + resume.getTitle());
    }

    public ResponseEntity<Resource> downloadDocument(Long documentId, boolean inline) {
        User user = securityUtils.getCurrentUser();
        if (!resumeRepository.existsByDocumentIdAndUserId(documentId, user.getId()))
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

    private Resume findOwned(Long resumeId, Long userId, Long workspaceId) {
        return resumeRepository.findByIdAndUserIdAndWorkspaceId(resumeId, userId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Resume not found"));
    }

    private ResumeResponse toResponse(Resume resume) {
        Document doc = resume.getDocument();
        return ResumeResponse.builder()
                .id(resume.getId())
                .title(resume.getTitle())
                .versionTag(resume.getVersionTag())
                .targetRoleCategory(resume.getTargetRoleCategory())
                .notes(resume.getNotes())
                .status(resume.getStatus())
                .documentId(doc.getId())
                .originalName(doc.getOriginalName())
                .contentType(doc.getContentType())
                .fileSize(doc.getFileSize())
                .createdAt(resume.getCreatedAt())
                .updatedAt(resume.getUpdatedAt())
                .build();
    }
}
