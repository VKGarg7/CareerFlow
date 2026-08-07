package com.careerflow.researchnote.dto;

import com.careerflow.researchnote.ResearchNoteSection;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResearchNoteUpdateRequest {
    private ResearchNoteSection section;
    private String title;
    private String content;
}
