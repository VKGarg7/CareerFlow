package com.careerflow.resume.dto;

import com.careerflow.resume.ResumeStatus;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResumeRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String versionTag;
    private String targetRoleCategory;
    private String notes;
    private ResumeStatus status;
}
