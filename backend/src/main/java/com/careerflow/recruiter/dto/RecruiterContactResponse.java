package com.careerflow.recruiter.dto;

import com.careerflow.recruiter.RecruiterSource;
import com.careerflow.recruiter.RecruiterStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class RecruiterContactResponse {
    private Long id;
    private String name;
    private String email;
    private String phone;
    private String linkedIn;
    private String company;
    private String jobTitle;
    private RecruiterStatus status;
    private RecruiterSource source;
    private LocalDate lastContactedAt;
    private String notes;
    private int noteCount;
    // Populated only for single-recruiter fetches and after note operations; null in list responses
    private List<RecruiterNoteResponse> interactionNotes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
