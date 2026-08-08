package com.careerflow.opportunity.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DuplicateCheckRequest {

    @NotNull(message = "Company ID is required")
    private Long companyId;

    private String roleTitle;
    private String jobLink;
    private String requisitionId;

    private Long excludeOpportunityId;
}
