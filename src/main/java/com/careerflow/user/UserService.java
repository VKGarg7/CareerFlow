package com.careerflow.user;

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
import java.util.regex.Pattern;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.net.MalformedURLException;
import java.nio.file.Paths;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private static final Pattern PHONE_PATTERN =
            Pattern.compile("^\\+?[1-9][0-9\\s\\-\\(\\)]{6,19}$");
    private static final Pattern LINKEDIN_PATTERN =
            Pattern.compile("^(https://)?(www\\.)?linkedin\\.com/in/[a-zA-Z0-9\\-_%]+/?$");
    private static final Pattern GITHUB_PATTERN =
            Pattern.compile("^(https://)?(www\\.)?github\\.com/[a-zA-Z0-9\\-]+(/[a-zA-Z0-9\\-._]+)?/?$");

    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final DocumentRepository documentRepository;

    public UserProfileResponse getMyProfile() {
        return toProfileResponse(getCurrentUser());
    }

    public void deleteProfile() {
        User user = getCurrentUser();
        userRepository.delete(user);
    }

    public ResponseEntity<Resource> downloadDocument(Long documentId) {
        User user = getCurrentUser();

        boolean owned = (user.getResume() != null && documentId.equals(user.getResume().getId()))
                || (user.getCoverLetter() != null && documentId.equals(user.getCoverLetter().getId()));

        if (!owned) {
            throw new ResourceNotFoundException("Document not found");
        }

        Document doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found"));

        try {
            Resource resource = new UrlResource(Paths.get(doc.getStoredPath()).toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new ResourceNotFoundException("File not found on server");
            }
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(doc.getContentType()))
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"" + doc.getOriginalName() + "\"")
                    .body(resource);
        } catch (MalformedURLException e) {
            throw new ResourceNotFoundException("File not found on server");
        }
    }

    public ProfileUpdateResponse updateDocuments(MultipartFile resume,
                                                MultipartFile coverLetter,
                                                Long deleteDocumentId) {
        User user = getCurrentUser();
        Map<String, FieldChange> changes = new LinkedHashMap<>();

        if (deleteDocumentId != null) {
            if (user.getResume() != null && deleteDocumentId.equals(user.getResume().getId())) {
                track(changes, "resume", user.getResume().getOriginalName(), null);
                documentRepository.deleteById(deleteDocumentId);
                user.setResume(null);
            } else if (user.getCoverLetter() != null && deleteDocumentId.equals(user.getCoverLetter().getId())) {
                track(changes, "coverLetter", user.getCoverLetter().getOriginalName(), null);
                documentRepository.deleteById(deleteDocumentId);
                user.setCoverLetter(null);
            } else {
                throw new ResourceNotFoundException("Document not found");
            }
        }

        if (resume != null && !resume.isEmpty()) {
            String oldName = user.getResume() != null ? user.getResume().getOriginalName() : null;
            Document doc = fileStorageService.storeDocument(resume, "resumes");
            track(changes, "resume", oldName, resume.getOriginalFilename());
            user.setResume(doc);
        }

        if (coverLetter != null && !coverLetter.isEmpty()) {
            String oldName = user.getCoverLetter() != null ? user.getCoverLetter().getOriginalName() : null;
            Document doc = fileStorageService.storeDocument(coverLetter, "cover-letters");
            track(changes, "coverLetter", oldName, coverLetter.getOriginalFilename());
            user.setCoverLetter(doc);
        }

        userRepository.save(user);
        return new ProfileUpdateResponse(changes);
    }

    public ProfileUpdateResponse saveProfile(UpdateProfileRequest request,
                                             MultipartFile resume,
                                             MultipartFile coverLetter) {
        User user = getCurrentUser();
        Map<String, FieldChange> changes = new LinkedHashMap<>();
        applyProfileFields(user, request, resume, coverLetter, changes);
        applyListFields(user, request, changes);
        userRepository.save(user);
        return new ProfileUpdateResponse(changes);
    }

    public ProfileUpdateResponse updateProfile(UpdateProfileRequest request,
                                               MultipartFile resume,
                                               MultipartFile coverLetter) {
        User user = getCurrentUser();
        Map<String, FieldChange> changes = new LinkedHashMap<>();
        applyProfileFields(user, request, resume, coverLetter, changes);
        appendListFields(user, request, changes);
        userRepository.save(user);
        return new ProfileUpdateResponse(changes);
    }

    // POST — replaces the entire list
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

    // PATCH — appends new entries to existing lists
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
                                    MultipartFile resume, MultipartFile coverLetter,
                                    Map<String, FieldChange> changes) {
        if (request != null) {
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
                if (!request.getPhoneNumber().isBlank() && !PHONE_PATTERN.matcher(request.getPhoneNumber()).matches())
                    throw new BadRequestException("Invalid phone number. Must be 7-20 characters and can include country code (e.g. +91 98765 43210)");
                if (!java.util.Objects.equals(request.getPhoneNumber(), user.getPhoneNumber())) {
                    track(changes, "phoneNumber", user.getPhoneNumber(), request.getPhoneNumber());
                    user.setPhoneNumber(request.getPhoneNumber());
                }
            }
            if (request.getLinkedinUrl() != null) {
                if (!request.getLinkedinUrl().isBlank() && !LINKEDIN_PATTERN.matcher(request.getLinkedinUrl()).matches())
                    throw new BadRequestException("Must be a valid LinkedIn profile URL (e.g. https://linkedin.com/in/username)");
                if (!java.util.Objects.equals(request.getLinkedinUrl(), user.getLinkedinUrl())) {
                    track(changes, "linkedinUrl", user.getLinkedinUrl(), request.getLinkedinUrl());
                    user.setLinkedinUrl(request.getLinkedinUrl());
                }
            }
            if (request.getGithubUrl() != null) {
                if (!request.getGithubUrl().isBlank() && !GITHUB_PATTERN.matcher(request.getGithubUrl()).matches())
                    throw new BadRequestException("Must be a valid GitHub URL (e.g. https://github.com/username)");
                if (!java.util.Objects.equals(request.getGithubUrl(), user.getGithubUrl())) {
                    track(changes, "githubUrl", user.getGithubUrl(), request.getGithubUrl());
                    user.setGithubUrl(request.getGithubUrl());
                }
            }
            if (request.getPortfolioUrl() != null && !java.util.Objects.equals(request.getPortfolioUrl(), user.getPortfolioUrl())) {
                track(changes, "portfolioUrl", user.getPortfolioUrl(), request.getPortfolioUrl());
                user.setPortfolioUrl(request.getPortfolioUrl());
            }
            if (request.getBio() != null && !java.util.Objects.equals(request.getBio(), user.getBio())) {
                track(changes, "bio", user.getBio(), request.getBio());
                user.setBio(request.getBio());
            }
        }

        if (resume != null && !resume.isEmpty()) {
            String oldName = user.getResume() != null ? user.getResume().getOriginalName() : null;
            Document doc = fileStorageService.storeDocument(resume, "resumes");
            track(changes, "resume", oldName, resume.getOriginalFilename());
            user.setResume(doc);
        }

        if (coverLetter != null && !coverLetter.isEmpty()) {
            String oldName = user.getCoverLetter() != null ? user.getCoverLetter().getOriginalName() : null;
            Document doc = fileStorageService.storeDocument(coverLetter, "cover-letters");
            track(changes, "coverLetter", oldName, coverLetter.getOriginalFilename());
            user.setCoverLetter(doc);
        }
    }

    private void track(Map<String, FieldChange> changes, String field, Object from, Object to) {
        if (changes != null) changes.put(field, new FieldChange(from, to));
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
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
                .resume(toDocumentDto(user.getResume()))
                .coverLetter(toDocumentDto(user.getCoverLetter()))
                .education(user.getEducation())
                .experience(user.getExperience())
                .projects(user.getProjects())
                .createdAt(user.getCreatedAt())
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
