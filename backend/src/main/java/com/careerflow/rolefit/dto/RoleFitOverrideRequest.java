package com.careerflow.rolefit.dto;

import com.careerflow.rolefit.FitTier;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RoleFitOverrideRequest {

    @Min(value = 0, message = "Override score must be at least 0")
    @Max(value = 100, message = "Override score must be at most 100")
    private Integer overrideFitScore;

    private FitTier overrideFitTier;
    private String decisionNote;
}
