package com.careerflow.coverletter.dto;

import com.careerflow.coverletter.CoverLetterStatus;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CoverLetterRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String targetRoleCategory;
    private String notes;
    private CoverLetterStatus status;
}
