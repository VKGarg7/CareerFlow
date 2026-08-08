package com.careerflow.strategy.dto;

import com.careerflow.strategy.ReadinessState;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class StrategyPlanResponse {
    private Long opportunityId;
    private List<StrategyItemResponse> items;
    private ReadinessState readiness;
    private int totalCount;
    private int completedCount;
    private int skippedCount;
}
