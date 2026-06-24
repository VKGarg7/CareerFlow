package com.careerflow.recruiter.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RecruiterNoteEditRequest {

    @NotNull(message = "Note id is required for editing")
    private Long id;

    @NotBlank(message = "Note content cannot be empty")
    @Size(max = 1000, message = "Note must be 1000 characters or fewer")
    private String content;
}
