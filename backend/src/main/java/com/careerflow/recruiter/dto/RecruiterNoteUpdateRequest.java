package com.careerflow.recruiter.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RecruiterNoteUpdateRequest {

    @NotBlank(message = "Note content cannot be empty")
    @Size(max = 1000, message = "Note must be 1000 characters or fewer")
    private String content;
}
