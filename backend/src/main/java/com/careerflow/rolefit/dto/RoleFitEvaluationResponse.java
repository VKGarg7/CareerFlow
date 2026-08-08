package com.careerflow.rolefit.dto;

import com.careerflow.rolefit.FitRating;
import com.careerflow.rolefit.FitTier;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class RoleFitEvaluationResponse {
    private Long id;
    private Long opportunityId;
    private String opportunityRoleTitle;

    private String requiredSkills;
    private String preferredSkills;
    private String userSkills;
    private Integer requiredExperienceYears;
    private Double userExperienceYears;
    private FitRating locationFit;
    private FitRating compensationFit;
    private String riskNotes;
    private String confidenceNotes;

    private Integer computedFitScore;
    private FitTier computedFitTier;
    private String missingSkills;
    private String scoreBreakdown;

    private Integer overrideFitScore;
    private FitTier overrideFitTier;
    private String decisionNote;

    private int effectiveFitScore;
    private FitTier effectiveFitTier;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
