package com.careerflow.interview.dto;

import com.careerflow.interview.InterviewOutcome;
import com.careerflow.interview.InterviewType;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class InterviewUpdateRequest {

    private LocalDateTime scheduledAt;

    private String round;

    private InterviewType interviewType;

    private String location;

    private String interviewerName;

    private String questionsAsked;

    private String feedbackReceived;

    private InterviewOutcome outcome;
}
