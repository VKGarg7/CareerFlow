package com.careerflow.opportunity.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class DuplicateMatch {
    private Long opportunityId;
    private String roleTitle;
    private String companyName;

    private String matchReason;
}
