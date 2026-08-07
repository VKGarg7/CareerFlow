package com.careerflow.researchnote.dto;

import com.careerflow.researchnote.ResearchNoteSection;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ResearchNoteResponse {
    private Long id;
    private Long companyId;
    private String companyName;
    private ResearchNoteSection section;
    private String title;
    private String content;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
