package com.careerflow.company.dto;

import com.careerflow.company.CompanyStatus;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.validator.constraints.URL;

@Getter
@Setter
public class CompanyRequest {

    @NotBlank(message = "Company name is required")
    private String name;

    @URL(message = "Website must be a valid URL")
    private String website;

    private String industry;
    private String location;
    private String description;
    private String notes;
    private CompanyStatus status;
}
