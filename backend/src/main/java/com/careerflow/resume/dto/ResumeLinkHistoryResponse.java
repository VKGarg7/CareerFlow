package com.careerflow.resume.dto;

import com.careerflow.resume.LinkAction;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ResumeLinkHistoryResponse {
    private Long id;
    private LinkAction action;
    private String previousResumeTitle;
    private String newResumeTitle;
    private LocalDateTime createdAt;
}
