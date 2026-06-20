package com.careerflow.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateProfileRequest {

    private String firstName;
    private String lastName;

    @Email(message = "Invalid email format")
    private String email;

    private String phoneNumber;
    @Pattern(
        regexp = "^(https://)?(www\\.)?linkedin\\.com/in/[a-zA-Z0-9\\-_%]+/?$",
        message = "Must be a valid LinkedIn profile URL (e.g. https://linkedin.com/in/username)"
    )
    private String linkedinUrl;

    @Pattern(
        regexp = "^(https://)?(www\\.)?github\\.com/[a-zA-Z0-9\\-]+(/[a-zA-Z0-9\\-._]+)?/?$",
        message = "Must be a valid GitHub URL (e.g. https://github.com/username)"
    )
    private String githubUrl;
    private String portfolioUrl;
    private String bio;
}
