package com.careerflow.interview.dto;

import com.careerflow.interview.InterviewOutcome;
import com.careerflow.interview.InterviewType;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class InterviewRequest {

    @NotNull(message = "Interview date/time is required")
    private LocalDateTime scheduledAt;

    private String round;

    private InterviewType interviewType;

    private String location;

    private String interviewerName;

    private String questionsAsked;

    private String feedbackReceived;

    private InterviewOutcome outcome;
}
