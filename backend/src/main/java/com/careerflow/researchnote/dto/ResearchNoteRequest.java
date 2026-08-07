package com.careerflow.researchnote.dto;

import com.careerflow.researchnote.ResearchNoteSection;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResearchNoteRequest {

    @NotNull(message = "Company is required")
    private Long companyId;

    @NotNull(message = "Section is required")
    private ResearchNoteSection section;

    private String title;

    @NotBlank(message = "Note content cannot be empty")
    private String content;
}
