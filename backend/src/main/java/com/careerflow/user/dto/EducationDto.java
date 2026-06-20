package com.careerflow.user.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class EducationDto {
    private String institution;
    private String degree;
    private String fieldOfStudy;

    @Pattern(regexp = "^\\d{4}$", message = "Start year must be in YYYY format (e.g. 2020)")
    private String startYear;

    @Pattern(regexp = "^\\d{4}$", message = "End year must be in YYYY format (e.g. 2024)")
    private String endYear;

    @JsonAlias("grade")
    private String cgpa;
}
