package com.careerflow.user.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class EducationDto {
    private String institution;
    private String degree;
    private String fieldOfStudy;
    private String startYear;
    private String endYear;
    private String grade;
}
