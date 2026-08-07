package com.careerflow.goal.dto;

import com.careerflow.goal.GoalMetricType;
import com.careerflow.goal.GoalStatus;
import jakarta.validation.constraints.Min;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class GoalUpdateRequest {

    private GoalMetricType metricType;

    @Min(value = 1, message = "Target value must be at least 1")
    private Integer targetValue;

    private LocalDate startDate;
    private LocalDate endDate;
    private GoalStatus status;
}
