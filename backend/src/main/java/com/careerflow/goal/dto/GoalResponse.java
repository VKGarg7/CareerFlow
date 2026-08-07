package com.careerflow.goal.dto;

import com.careerflow.goal.GoalMetricType;
import com.careerflow.goal.GoalStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
public class GoalResponse {
    private Long id;
    private GoalMetricType metricType;
    private Integer targetValue;
    private LocalDate startDate;
    private LocalDate endDate;
    private GoalStatus status;
    private long progress;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
