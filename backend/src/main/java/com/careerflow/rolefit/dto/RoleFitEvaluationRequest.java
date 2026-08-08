package com.careerflow.rolefit.dto;

import com.careerflow.rolefit.FitRating;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RoleFitEvaluationRequest {

    @NotNull(message = "Opportunity ID is required")
    private Long opportunityId;

    private String requiredSkills;
    private String preferredSkills;
    private String userSkills;
    private Integer requiredExperienceYears;
    private Double userExperienceYears;
    private FitRating locationFit;
    private FitRating compensationFit;
    private String riskNotes;
    private String confidenceNotes;
}
