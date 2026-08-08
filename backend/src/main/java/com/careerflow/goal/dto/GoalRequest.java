package com.careerflow.goal.dto;

import com.careerflow.goal.GoalMetricType;
import com.careerflow.goal.GoalStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class GoalRequest {

    @NotNull(message = "Metric type is required")
    private GoalMetricType metricType;

    @NotNull(message = "Target value is required")
    @Min(value = 1, message = "Target value must be at least 1")
    private Integer targetValue;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    private LocalDate endDate;

    private GoalStatus status;
}
