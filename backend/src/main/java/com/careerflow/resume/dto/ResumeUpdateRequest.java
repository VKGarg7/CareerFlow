package com.careerflow.resume.dto;

import com.careerflow.resume.ResumeStatus;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResumeUpdateRequest {

    private String title;
    private String versionTag;
    private String targetRoleCategory;
    private String notes;
    private ResumeStatus status;
}
