package com.careerflow.coverletter.dto;

import com.careerflow.coverletter.CoverLetterStatus;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CoverLetterUpdateRequest {

    private String title;
    private String targetRoleCategory;
    private String notes;
    private CoverLetterStatus status;
}
