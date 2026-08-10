package com.careerflow.application.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ResumeAnalysisItem {
    private Long resumeId;
    private String resumeTitle;
    private String roleCategory;
    private long total;
    private long oaClears;
    private long interviews;
    private long offers;
    private double interviewRate;
    private double offerRate;
}
