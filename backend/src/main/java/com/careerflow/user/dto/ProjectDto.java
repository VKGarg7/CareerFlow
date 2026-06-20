package com.careerflow.user.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class ProjectDto {
    private String name;
    private String description;
    private String websiteUrl;
    private String githubUrl;
    private String techStack;
}
