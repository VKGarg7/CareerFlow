package com.careerflow.user;

import com.careerflow.config.FileStorageService;
import com.careerflow.document.Document;
import com.careerflow.document.DocumentDto;
import com.careerflow.exception.BadRequestException;
import com.careerflow.exception.DuplicateResourceException;
import com.careerflow.exception.ResourceNotFoundException;
import com.careerflow.user.dto.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Base64;

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

    public UserProfileResponse getMyProfile() {
        return toProfileResponse(getCurrentUser());
    }

    public UserProfileResponse saveProfile(UpdateProfileRequest request,
                                           MultipartFile resume,
                                           MultipartFile coverLetter) {
        User user = getCurrentUser();
        applyProfileFields(user, request, resume, coverLetter, null);
        return toProfileResponse(userRepository.save(user));
    }

    public ProfileUpdateResponse updateProfile(UpdateProfileRequest request,
                                               MultipartFile resume,
                                               MultipartFile coverLetter) {
        User user = getCurrentUser();
        Map<String, FieldChange> changes = new LinkedHashMap<>();
        applyProfileFields(user, request, resume, coverLetter, changes);
        userRepository.save(user);
        return new ProfileUpdateResponse(changes);
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

    public EducationDto addEducation(EducationDto dto) {
        User user = getCurrentUser();
        List<EducationDto> list = user.getEducation() != null
                ? new java.util.ArrayList<>(user.getEducation()) : new java.util.ArrayList<>();

        list.stream()
                .filter(e -> java.util.Objects.equals(e.getInstitution(), dto.getInstitution())
                        && java.util.Objects.equals(e.getDegree(), dto.getDegree())
                        && java.util.Objects.equals(e.getFieldOfStudy(), dto.getFieldOfStudy()))
                .findFirst()
                .ifPresent(existing -> {
                    throw new DuplicateResourceException(
                            "Education entry already exists for " + dto.getDegree() + " at " + dto.getInstitution());
                });

        list.add(dto);
        user.setEducation(list);
        userRepository.save(user);
        return dto;
    }

    public ExperienceDto addExperience(ExperienceDto dto) {
        User user = getCurrentUser();
        List<ExperienceDto> list = user.getExperience() != null
                ? new java.util.ArrayList<>(user.getExperience()) : new java.util.ArrayList<>();

        list.stream()
                .filter(e -> java.util.Objects.equals(e.getCompany(), dto.getCompany())
                        && java.util.Objects.equals(e.getRole(), dto.getRole())
                        && java.util.Objects.equals(e.getStartDate(), dto.getStartDate()))
                .findFirst()
                .ifPresent(existing -> {
                    throw new DuplicateResourceException(
                            "Experience entry already exists for " + dto.getRole() + " at " + dto.getCompany());
                });

        list.add(dto);
        user.setExperience(list);
        userRepository.save(user);
        return dto;
    }

    public ProjectDto addProject(ProjectDto dto) {
        User user = getCurrentUser();
        List<ProjectDto> list = user.getProjects() != null
                ? new java.util.ArrayList<>(user.getProjects()) : new java.util.ArrayList<>();

        list.stream()
                .filter(p -> java.util.Objects.equals(p.getName(), dto.getName()))
                .findFirst()
                .ifPresent(existing -> {
                    throw new DuplicateResourceException(
                            "Project '" + dto.getName() + "' already exists");
                });

        list.add(dto);
        user.setProjects(list);
        userRepository.save(user);
        return dto;
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
                .content(encodeFile(doc.getStoredPath()))
                .uploadedAt(doc.getUploadedAt())
                .build();
    }

    private String encodeFile(String filePath) {
        if (filePath == null) return null;
        try {
            byte[] bytes = Files.readAllBytes(Paths.get(filePath));
            return Base64.getEncoder().encodeToString(bytes);
        } catch (Exception e) {
            log.warn("Could not read file at path {}: {}", filePath, e.getMessage());
            return null;
        }
    }
}