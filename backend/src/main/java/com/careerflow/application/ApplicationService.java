package com.careerflow.application;

import com.careerflow.application.dto.ApplicationRequest;
import com.careerflow.application.dto.ApplicationResponse;
import com.careerflow.application.dto.ApplicationUpdateRequest;
import com.careerflow.common.SecurityUtils;
import com.careerflow.common.SortHelper;
import com.careerflow.company.Company;
import com.careerflow.company.CompanyRepository;
import com.careerflow.config.FileStorageService;
import com.careerflow.document.Document;
import com.careerflow.document.DocumentDto;
import com.careerflow.document.DocumentRepository;
import com.careerflow.exception.BadRequestException;
import com.careerflow.exception.ResourceNotFoundException;
import com.careerflow.followup.FollowUpRepository;
import com.careerflow.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.net.MalformedURLException;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@SuppressWarnings("null")
@Service
@RequiredArgsConstructor
public class ApplicationService {

    private static final Set<String> SORTABLE_FIELDS =
            Set.of("role", "applicationDate", "status", "source", "createdAt", "updatedAt");
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(".pdf", ".doc", ".docx");

    private final ApplicationRepository applicationRepository;
    private final CompanyRepository companyRepository;
    private final FollowUpRepository followUpRepository;
    private final FileStorageService fileStorageService;
    private final DocumentRepository documentRepository;
    private final SecurityUtils securityUtils;
    private final com.careerflow.user.UserResumeRepository userResumeRepository;

    public ApplicationResponse addApplication(ApplicationRequest request) {
        User user = securityUtils.getCurrentUser();
        Company company = findOwnedCompany(request.getCompanyId(), user.getId());

        JobApplication application = JobApplication.builder()
                .user(user)
                .company(company)
                .role(request.getRole())
                .applicationDate(request.getApplicationDate())
                .source(request.getSource())
                .status(request.getStatus() != null ? request.getStatus() : ApplicationStatus.APPLIED)
                .expectedSalary(request.getExpectedSalary())
                .notes(request.getNotes())
                .build();

        return toResponse(applicationRepository.save(application));
    }

    public List<ApplicationResponse> getMyApplications(
            Long companyId, ApplicationStatus status, String sortBy, String order) {
        User user = securityUtils.getCurrentUser();
        Sort sort = SortHelper.build(sortBy, order, SORTABLE_FIELDS);

        List<JobApplication> results;
        if (companyId != null && status != null) {
            results = applicationRepository.findAllByUserIdAndCompanyIdAndStatus(user.getId(), companyId, status, sort);
        } else if (companyId != null) {
            results = applicationRepository.findAllByUserIdAndCompanyId(user.getId(), companyId, sort);
        } else if (status != null) {
            results = applicationRepository.findAllByUserIdAndStatus(user.getId(), status, sort);
        } else {
            results = applicationRepository.findAllByUserId(user.getId(), sort);
        }

        Map<Long, LocalDate> nearestFollowUps = buildNearestFollowUpMap(results);
        Map<Long, LocalDate> upcomingFollowUps = buildUpcomingFollowUpMap(results);
        return results.stream().map(a -> toResponse(a, nearestFollowUps.get(a.getId()), upcomingFollowUps.get(a.getId()))).toList();
    }

    public ApplicationResponse updateApplication(Long id, ApplicationUpdateRequest request) {
        User user = securityUtils.getCurrentUser();
        JobApplication application = findOwned(id, user.getId());

        if (request.getCompanyId() != null) {
            Company company = findOwnedCompany(request.getCompanyId(), user.getId());
            application.setCompany(company);
        }
        if (request.getRole() != null && !request.getRole().isBlank())
            application.setRole(request.getRole());
        if (request.getApplicationDate() != null)
            application.setApplicationDate(request.getApplicationDate());
        if (request.getSource() != null)
            application.setSource(request.getSource());
        if (request.getStatus() != null)
            application.setStatus(request.getStatus());
        if (request.getExpectedSalary() != null)
            application.setExpectedSalary(request.getExpectedSalary());
        if (request.getNotes() != null)
            application.setNotes(request.getNotes());

        return toResponse(applicationRepository.save(application));
    }

    public void deleteApplication(Long id) {
        User user = securityUtils.getCurrentUser();
        JobApplication application = findOwned(id, user.getId());
        application.softDelete();
        applicationRepository.save(application);
    }

    @Transactional
    public void deleteAllByCompany(Long companyId) {
        applicationRepository.softDeleteAllByCompanyId(companyId, LocalDateTime.now());
    }

    public boolean hasApplications(Long userId, Long companyId) {
        return applicationRepository.existsByUserIdAndCompanyId(userId, companyId);
    }

    // ─── Documents ────────────────────────────────────────────────────────────

    public ApplicationResponse uploadDocuments(Long appId, MultipartFile resume,
                                               MultipartFile coverLetter, Long profileResumeDocumentId) {
        User user = securityUtils.getCurrentUser();
        JobApplication application = findOwned(appId, user.getId());

        if (profileResumeDocumentId != null) {
            if (!userResumeRepository.existsByUserIdAndDocumentId(user.getId(), profileResumeDocumentId))
                throw new ResourceNotFoundException("Profile resume not found");
            Document source = documentRepository.findById(profileResumeDocumentId)
                    .orElseThrow(() -> new ResourceNotFoundException("Document not found"));
            Document copy = Document.builder()
                    .originalName(source.getOriginalName())
                    .storedPath(source.getStoredPath())
                    .fileSize(source.getFileSize())
                    .contentType(source.getContentType())
                    .build();
            application.setResume(documentRepository.save(copy));
        } else if (resume != null && !resume.isEmpty()) {
            validateExtension(resume);
            Document doc = fileStorageService.storeDocument(resume, "application-resumes");
            application.setResume(doc);
        }

        if (coverLetter != null && !coverLetter.isEmpty()) {
            validateExtension(coverLetter);
            Document doc = fileStorageService.storeDocument(coverLetter, "application-cover-letters");
            application.setCoverLetter(doc);
        }

        applicationRepository.save(application);
        return toResponse(application);
    }

    public ApplicationResponse deleteDocument(Long appId, Long documentId) {
        User user = securityUtils.getCurrentUser();
        JobApplication application = findOwned(appId, user.getId());

        if (application.getResume() != null && documentId.equals(application.getResume().getId())) {
            application.setResume(null);
        } else if (application.getCoverLetter() != null && documentId.equals(application.getCoverLetter().getId())) {
            application.setCoverLetter(null);
        } else {
            throw new ResourceNotFoundException("Document not found");
        }

        applicationRepository.save(application);
        return toResponse(application);
    }

    public ResponseEntity<Resource> downloadDocument(Long documentId, boolean inline) {
        User user = securityUtils.getCurrentUser();

        boolean owned = applicationRepository.findByResumeIdAndUserId(documentId, user.getId()).isPresent()
                || applicationRepository.findByCoverLetterIdAndUserId(documentId, user.getId()).isPresent();
        if (!owned) throw new ResourceNotFoundException("Document not found");

        Document doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found"));

        try {
            Resource resource = new UrlResource(Paths.get(doc.getStoredPath()).toUri());
            if (!resource.exists() || !resource.isReadable())
                throw new ResourceNotFoundException("File not found on server");

            String disposition = inline
                    ? "inline; filename=\"" + doc.getOriginalName() + "\""
                    : "attachment; filename=\"" + doc.getOriginalName() + "\"";
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(doc.getContentType()))
                    .header(HttpHeaders.CONTENT_DISPOSITION, disposition)
                    .body(resource);
        } catch (MalformedURLException e) {
            throw new ResourceNotFoundException("File not found on server");
        }
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    private void validateExtension(MultipartFile file) {
        String name = file.getOriginalFilename() != null ? file.getOriginalFilename() : "";
        String ext = name.contains(".") ? name.substring(name.lastIndexOf(".")).toLowerCase() : "";
        if (!ALLOWED_EXTENSIONS.contains(ext))
            throw new BadRequestException("Only PDF, DOC, and DOCX files are supported");
    }

    private JobApplication findOwned(Long appId, Long userId) {
        return applicationRepository.findByIdAndUserId(appId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));
    }

    private Company findOwnedCompany(Long companyId, Long userId) {
        return companyRepository.findByIdAndUserId(companyId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found"));
    }

    private Map<Long, LocalDate> buildNearestFollowUpMap(List<JobApplication> apps) {
        if (apps.isEmpty()) return Map.of();
        List<Long> ids = apps.stream().map(JobApplication::getId).toList();
        return followUpRepository.findNearestPendingFollowUpDates(ids).stream()
                .collect(Collectors.toMap(row -> (Long) row[0], row -> (LocalDate) row[1]));
    }

    private Map<Long, LocalDate> buildUpcomingFollowUpMap(List<JobApplication> apps) {
        if (apps.isEmpty()) return Map.of();
        List<Long> ids = apps.stream().map(JobApplication::getId).toList();
        return followUpRepository.findNearestUpcomingFollowUpDates(ids, LocalDate.now()).stream()
                .collect(Collectors.toMap(row -> (Long) row[0], row -> (LocalDate) row[1]));
    }

    private ApplicationResponse toResponse(JobApplication app) {
        return toResponse(app, null, null);
    }

    private ApplicationResponse toResponse(JobApplication app, LocalDate nextFollowUpDate, LocalDate nextUpcomingFollowUpDate) {
        return ApplicationResponse.builder()
                .id(app.getId())
                .companyId(app.getCompany().getId())
                .companyName(app.getCompany().getName())
                .role(app.getRole())
                .applicationDate(app.getApplicationDate())
                .source(app.getSource())
                .status(app.getStatus())
                .expectedSalary(app.getExpectedSalary())
                .notes(app.getNotes())
                .resume(toDocumentDto(app.getResume()))
                .coverLetter(toDocumentDto(app.getCoverLetter()))
                .nextFollowUpDate(nextFollowUpDate)
                .nextUpcomingFollowUpDate(nextUpcomingFollowUpDate)
                .createdAt(app.getCreatedAt())
                .updatedAt(app.getUpdatedAt())
                .build();
    }

    private DocumentDto toDocumentDto(Document doc) {
        if (doc == null) return null;
        return DocumentDto.builder()
                .id(doc.getId())
                .originalName(doc.getOriginalName())
                .contentType(doc.getContentType())
                .fileSize(doc.getFileSize())
                .uploadedAt(doc.getUploadedAt())
                .build();
    }
}
