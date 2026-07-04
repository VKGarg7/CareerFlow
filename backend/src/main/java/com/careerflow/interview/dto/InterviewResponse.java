package com.careerflow.interview.dto;

import com.careerflow.interview.InterviewOutcome;
import com.careerflow.interview.InterviewType;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class InterviewResponse {
    private Long id;
    private Long applicationId;
    private Long companyId;
    private String companyName;
    private String role;
    private LocalDateTime scheduledAt;
    private String round;
    private InterviewType interviewType;
    private String location;
    private String interviewerName;
    private String questionsAsked;
    private String feedbackReceived;
    private InterviewOutcome outcome;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
