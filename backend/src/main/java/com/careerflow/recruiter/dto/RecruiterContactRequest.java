package com.careerflow.recruiter.dto;

import com.careerflow.recruiter.RecruiterSource;
import com.careerflow.recruiter.RecruiterStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.validator.constraints.URL;

import java.time.LocalDate;

@Getter
@Setter
public class RecruiterContactRequest {

    @NotBlank(message = "Recruiter name is required")
    @Size(max = 100, message = "Name must be 100 characters or fewer")
    private String name;

    @Email(message = "Email must be a valid email address")
    @Size(max = 150, message = "Email must be 150 characters or fewer")
    private String email;

    @Pattern(
        regexp = "^[+]?[0-9()\\-\\s.]{7,20}$",
        message = "Phone must be 7–20 characters and contain only digits, spaces, +, -, (, ), or ."
    )
    private String phone;

    @URL(message = "LinkedIn must be a valid URL")
    @Size(max = 300, message = "LinkedIn URL must be 300 characters or fewer")
    private String linkedIn;

    @Size(max = 150, message = "Company must be 150 characters or fewer")
    private String company;

    @Size(max = 100, message = "Job title must be 100 characters or fewer")
    private String jobTitle;

    private RecruiterStatus status;

    private RecruiterSource source;

    private LocalDate lastContactedAt;

    @Size(max = 2000, message = "Notes must be 2000 characters or fewer")
    private String notes;
}
