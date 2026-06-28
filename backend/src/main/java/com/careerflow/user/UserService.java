package com.careerflow.user;

import com.careerflow.common.SecurityUtils;
import com.careerflow.config.FileStorageService;
import com.careerflow.document.Document;
import com.careerflow.document.DocumentDto;
import com.careerflow.document.DocumentRepository;
import com.careerflow.exception.BadRequestException;
import com.careerflow.exception.ResourceNotFoundException;
import com.careerflow.user.dto.*;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.net.MalformedURLException;
import java.nio.file.Paths;

@Slf4j
@SuppressWarnings("null")
@Service
@RequiredArgsConstructor
public class UserService {

    private static final Pattern PHONE_PATTERN =
            Pattern.compile("^\\+?[1-9][0-9\\s\\-\\(\\)]{6,19}$");
    private static final Pattern LINKEDIN_PATTERN =
            Pattern.compile("^(https://)?(www\\.)?linkedin\\.com/in/[a-zA-Z0-9\\-_%]+/?$");
    private static final Pattern GITHUB_PATTERN =
            Pattern.compile("^(https://)?(www\\.)?github\\.com/[a-zA-Z0-9\\-]+(/[a-zA-Z0-9\\-._]+)?/?$");
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(".pdf", ".doc", ".docx");

    private final UserRepository userRepository;
    private final UserResumeRepository userResumeRepository;
    private final FileStorageService fileStorageService;
    private final DocumentRepository documentRepository;
    private final SecurityUtils securityUtils;

    // ─── Profile CRUD ──────────────────────────────────────────────────────────

    public UserProfileResponse getMyProfile() {
        return toProfileResponse(getCurrentUser());
    }

    public void deleteProfile() {
        userRepository.delete(getCurrentUser());
    }

    public ProfileUpdateResponse saveProfile(UpdateProfileRequest request) {
        User user = getCurrentUser();
        Map<String, FieldChange> changes = new LinkedHashMap<>();
        applyProfileFields(user, request, changes);
        applyListFields(user, request, changes);
        userRepository.save(user);
        return new ProfileUpdateResponse(changes);
    }

    public ProfileUpdateResponse updateProfile(UpdateProfileRequest request) {
        User user = getCurrentUser();
        Map<String, FieldChange> changes = new LinkedHashMap<>();
        applyProfileFields(user, request, changes);
        appendListFields(user, request, changes);
        userRepository.save(user);
        return new ProfileUpdateResponse(changes);
    }

    // ─── Documents (resumes + cover letter) ───────────────────────────────────

    @Transactional
    public UserProfileResponse updateDocuments(MultipartFile resume,
                                               MultipartFile coverLetter,
                                               Long deleteDocumentId) {
        User user = getCurrentUser();

        if (deleteDocumentId != null) {
            boolean removedResume = user.getResumes()
                    .removeIf(r -> deleteDocumentId.equals(r.getDocument().getId()));
            if (!removedResume) {
                if (user.getCoverLetter() != null
                        && deleteDocumentId.equals(user.getCoverLetter().getId())) {
                    user.setCoverLetter(null);
                } else {
                    throw new ResourceNotFoundException("Document not found");
                }
            }
        }
        if (resume != null && !resume.isEmpty()) {
            validateExtension(resume);
            Document doc = fileStorageService.storeDocument(resume, "profile-resumes");
            user.getResumes().add(UserResume.builder().user(user).document(doc).build());
        }
        if (coverLetter != null && !coverLetter.isEmpty()) {
            validateExtension(coverLetter);
            Document doc = fileStorageService.storeDocument(coverLetter, "profile-cover-letters");
            user.setCoverLetter(doc);
        }

        User saved = userRepository.saveAndFlush(user);
        return toProfileResponse(saved);
    }

    // ─── Document download ─────────────────────────────────────────────────────

    public ResponseEntity<Resource> downloadDocument(Long documentId, boolean inline) {
        User user = getCurrentUser();

        boolean owned = userResumeRepository.existsByUserIdAndDocumentId(user.getId(), documentId)
                || (user.getCoverLetter() != null && documentId.equals(user.getCoverLetter().getId()));
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

    // ─── Private helpers ───────────────────────────────────────────────────────

    private void validateExtension(MultipartFile file) {
        String name = file.getOriginalFilename() != null ? file.getOriginalFilename() : "";
        String ext = name.contains(".") ? name.substring(name.lastIndexOf(".")).toLowerCase() : "";
        if (!ALLOWED_EXTENSIONS.contains(ext))
            throw new BadRequestException("Only PDF, DOC, and DOCX files are supported");
    }

    private void applyListFields(User user, UpdateProfileRequest request,
                                 Map<String, FieldChange> changes) {
        if (request == null) return;
        if (request.getEducation() != null) {
            track(changes, "education", user.getEducation(), request.getEducation());
            user.setEducation(request.getEducation());
        }
        if (request.getExperience() != null) {
            track(changes, "experience", user.getExperience(), request.getExperience());
            user.setExperience(request.getExperience());
        }
        if (request.getProjects() != null) {
            track(changes, "projects", user.getProjects(), request.getProjects());
            user.setProjects(request.getProjects());
        }
    }

    private void appendListFields(User user, UpdateProfileRequest request,
                                  Map<String, FieldChange> changes) {
        if (request == null) return;
        if (request.getEducation() != null) {
            List<EducationDto> merged = new ArrayList<>(
                    user.getEducation() != null ? user.getEducation() : List.of());
            merged.addAll(request.getEducation());
            track(changes, "education", user.getEducation(), request.getEducation());
            user.setEducation(merged);
        }
        if (request.getExperience() != null) {
            List<ExperienceDto> merged = new ArrayList<>(
                    user.getExperience() != null ? user.getExperience() : List.of());
            merged.addAll(request.getExperience());
            track(changes, "experience", user.getExperience(), request.getExperience());
            user.setExperience(merged);
        }
        if (request.getProjects() != null) {
            List<ProjectDto> merged = new ArrayList<>(
                    user.getProjects() != null ? user.getProjects() : List.of());
            merged.addAll(request.getProjects());
            track(changes, "projects", user.getProjects(), request.getProjects());
            user.setProjects(merged);
        }
    }

    private void applyProfileFields(User user, UpdateProfileRequest request,
                                    Map<String, FieldChange> changes) {
        if (request == null) return;
        if (request.getFirstName() != null && !request.getFirstName().isBlank()
                && !request.getFirstName().equals(user.getFirstName())) {
            track(changes, "firstName", user.getFirstName(), request.getFirstName());
            user.setFirstName(request.getFirstName());
        }
        if (request.getLastName() != null) {
            String newVal = request.getLastName().isBlank() ? null : request.getLastName();
            if (!java.util.Objects.equals(newVal, user.getLastName())) {
                track(changes, "lastName", user.getLastName(), newVal);
                user.setLastName(newVal);
            }
        }
        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            String newEmail = request.getEmail().toLowerCase();
            if (!newEmail.equals(user.getEmail())) {
                if (userRepository.existsByEmail(newEmail))
                    throw new BadRequestException("Email is already in use");
                track(changes, "email", user.getEmail(), newEmail);
                user.setEmail(newEmail);
            }
        }
        if (request.getPhoneNumber() != null) {
            if (!request.getPhoneNumber().isBlank()
                    && !PHONE_PATTERN.matcher(request.getPhoneNumber()).matches())
                throw new BadRequestException("Invalid phone number.");
            if (!java.util.Objects.equals(request.getPhoneNumber(), user.getPhoneNumber())) {
                track(changes, "phoneNumber", user.getPhoneNumber(), request.getPhoneNumber());
                user.setPhoneNumber(request.getPhoneNumber());
            }
        }
        if (request.getLinkedinUrl() != null) {
            if (!request.getLinkedinUrl().isBlank()
                    && !LINKEDIN_PATTERN.matcher(request.getLinkedinUrl()).matches())
                throw new BadRequestException("Must be a valid LinkedIn profile URL.");
            if (!java.util.Objects.equals(request.getLinkedinUrl(), user.getLinkedinUrl())) {
                track(changes, "linkedinUrl", user.getLinkedinUrl(), request.getLinkedinUrl());
                user.setLinkedinUrl(request.getLinkedinUrl());
            }
        }
        if (request.getGithubUrl() != null) {
            if (!request.getGithubUrl().isBlank()
                    && !GITHUB_PATTERN.matcher(request.getGithubUrl()).matches())
                throw new BadRequestException("Must be a valid GitHub URL.");
            if (!java.util.Objects.equals(request.getGithubUrl(), user.getGithubUrl())) {
                track(changes, "githubUrl", user.getGithubUrl(), request.getGithubUrl());
                user.setGithubUrl(request.getGithubUrl());
            }
        }
        if (request.getPortfolioUrl() != null
                && !java.util.Objects.equals(request.getPortfolioUrl(), user.getPortfolioUrl())) {
            track(changes, "portfolioUrl", user.getPortfolioUrl(), request.getPortfolioUrl());
            user.setPortfolioUrl(request.getPortfolioUrl());
        }
        if (request.getBio() != null
                && !java.util.Objects.equals(request.getBio(), user.getBio())) {
            track(changes, "bio", user.getBio(), request.getBio());
            user.setBio(request.getBio());
        }
    }

    private void track(Map<String, FieldChange> changes, String field, Object from, Object to) {
        if (changes != null) changes.put(field, new FieldChange(from, to));
    }

    private User getCurrentUser() {
        return securityUtils.getCurrentUser();
    }

    private UserProfileResponse toProfileResponse(User user) {
        return UserProfileResponse.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .linkedinUrl(user.getLinkedinUrl())
                .githubUrl(user.getGithubUrl())
                .portfolioUrl(user.getPortfolioUrl())
                .bio(user.getBio())
                .resumes(user.getResumes().stream().map(this::toResumeDto).toList())
                .coverLetter(toDocumentDto(user.getCoverLetter()))
                .education(user.getEducation())
                .experience(user.getExperience())
                .projects(user.getProjects())
                .createdAt(user.getCreatedAt())
                .build();
    }

    private UserResumeDto toResumeDto(UserResume r) {
        Document doc = r.getDocument();
        return UserResumeDto.builder()
                .id(r.getId())
                .documentId(doc.getId())
                .originalName(doc.getOriginalName())
                .contentType(doc.getContentType())
                .fileSize(doc.getFileSize())
                .uploadedAt(r.getUploadedAt())
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
