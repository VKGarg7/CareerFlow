package com.careerflow.user.dto;

import com.careerflow.document.DocumentDto;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class UserProfileResponse {
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private String phoneNumber;
    private String linkedinUrl;
    private String githubUrl;
    private String portfolioUrl;
    private String bio;
    private List<UserResumeDto> resumes;
    private DocumentDto coverLetter;
    private List<EducationDto> education;
    private List<ExperienceDto> experience;
    private List<ProjectDto> projects;
    private LocalDateTime createdAt;
}
