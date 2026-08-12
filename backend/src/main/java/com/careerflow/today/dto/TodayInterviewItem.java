package com.careerflow.today.dto;

import com.careerflow.interview.InterviewOutcome;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class TodayInterviewItem {
    private Long id;
    private Long applicationId;
    private String companyName;
    private String role;
    private LocalDateTime scheduledAt;
    private String round;
    private InterviewOutcome outcome;
}
