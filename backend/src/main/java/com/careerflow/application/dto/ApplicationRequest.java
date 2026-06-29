package com.careerflow.application.dto;

import com.careerflow.application.ApplicationSource;
import com.careerflow.application.ApplicationStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class ApplicationRequest {

    @NotNull(message = "Company ID is required")
    private Long companyId;

    @NotBlank(message = "Role is required")
    private String role;

    private LocalDate applicationDate;
    private LocalDate deadline;
    private ApplicationSource source;
    private ApplicationStatus status;
    private String expectedSalary;
    private String notes;
}
