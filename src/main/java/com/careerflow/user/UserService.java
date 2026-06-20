package com.careerflow.user;

import com.careerflow.config.FileStorageService;
import com.careerflow.exception.BadRequestException;
import com.careerflow.exception.ResourceNotFoundException;
import com.careerflow.user.dto.*;

import java.util.List;
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

    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;

    public UserProfileResponse getMyProfile() {
        return toProfileResponse(getCurrentUser());
    }

    public UserProfileResponse saveProfile(UpdateProfileRequest request,
                                           MultipartFile resume,
                                           MultipartFile coverLetter) {
        User user = getCurrentUser();

        if (request != null) {
            if (request.getFirstName() != null && !request.getFirstName().isBlank())
                user.setFirstName(request.getFirstName());
            if (request.getLastName() != null)
                user.setLastName(request.getLastName().isBlank() ? null : request.getLastName());
            if (request.getEmail() != null && !request.getEmail().isBlank()) {
                String newEmail = request.getEmail().toLowerCase();
                if (!newEmail.equals(user.getEmail()) && userRepository.existsByEmail(newEmail))
                    throw new BadRequestException("Email is already in use");
                user.setEmail(newEmail);
            }
            if (request.getPhoneNumber() != null) user.setPhoneNumber(request.getPhoneNumber());
            if (request.getLinkedinUrl() != null) user.setLinkedinUrl(request.getLinkedinUrl());
            if (request.getGithubUrl() != null) user.setGithubUrl(request.getGithubUrl());
            if (request.getPortfolioUrl() != null) user.setPortfolioUrl(request.getPortfolioUrl());
            if (request.getBio() != null) user.setBio(request.getBio());
        }

        if (resume != null && !resume.isEmpty())
            user.setResumePath(fileStorageService.store(resume, "resumes"));

        if (coverLetter != null && !coverLetter.isEmpty())
            user.setCoverLetterPath(fileStorageService.store(coverLetter, "cover-letters"));

        return toProfileResponse(userRepository.save(user));
    }

    public UserProfileResponse addEducation(EducationDto dto) {
        User user = getCurrentUser();
        List<EducationDto> list = user.getEducation() != null ? new java.util.ArrayList<>(user.getEducation()) : new java.util.ArrayList<>();
        list.add(dto);
        user.setEducation(list);
        return toProfileResponse(userRepository.save(user));
    }

    public UserProfileResponse removeEducation(int index) {
        User user = getCurrentUser();
        List<EducationDto> list = new java.util.ArrayList<>(user.getEducation());
        if (index < 0 || index >= list.size()) throw new BadRequestException("Invalid index");
        list.remove(index);
        user.setEducation(list);
        return toProfileResponse(userRepository.save(user));
    }

    public UserProfileResponse addExperience(ExperienceDto dto) {
        User user = getCurrentUser();
        List<ExperienceDto> list = user.getExperience() != null ? new java.util.ArrayList<>(user.getExperience()) : new java.util.ArrayList<>();
        list.add(dto);
        user.setExperience(list);
        return toProfileResponse(userRepository.save(user));
    }

    public UserProfileResponse removeExperience(int index) {
        User user = getCurrentUser();
        List<ExperienceDto> list = new java.util.ArrayList<>(user.getExperience());
        if (index < 0 || index >= list.size()) throw new BadRequestException("Invalid index");
        list.remove(index);
        user.setExperience(list);
        return toProfileResponse(userRepository.save(user));
    }

    public UserProfileResponse addProject(ProjectDto dto) {
        User user = getCurrentUser();
        List<ProjectDto> list = user.getProjects() != null ? new java.util.ArrayList<>(user.getProjects()) : new java.util.ArrayList<>();
        list.add(dto);
        user.setProjects(list);
        return toProfileResponse(userRepository.save(user));
    }

    public UserProfileResponse removeProject(int index) {
        User user = getCurrentUser();
        List<ProjectDto> list = new java.util.ArrayList<>(user.getProjects());
        if (index < 0 || index >= list.size()) throw new BadRequestException("Invalid index");
        list.remove(index);
        user.setProjects(list);
        return toProfileResponse(userRepository.save(user));
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
                .resume(encodeFile(user.getResumePath()))
                .coverLetter(encodeFile(user.getCoverLetterPath()))
                .education(user.getEducation())
                .experience(user.getExperience())
                .projects(user.getProjects())
                .createdAt(user.getCreatedAt())
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
