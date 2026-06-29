package com.careerflow.application.dto;

import com.careerflow.application.ApplicationSource;
import com.careerflow.application.ApplicationStatus;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class ApplicationUpdateRequest {
    private Long companyId;
    private String role;
    private LocalDate applicationDate;
    private LocalDate deadline;
    private ApplicationSource source;
    private ApplicationStatus status;
    private String expectedSalary;
    private String notes;
}
