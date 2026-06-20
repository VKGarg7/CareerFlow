package com.careerflow.user.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProjectDto {
    private String name;
    private String description;
    private String websiteUrl;
    private String githubUrl;
    private String techStack;
}
