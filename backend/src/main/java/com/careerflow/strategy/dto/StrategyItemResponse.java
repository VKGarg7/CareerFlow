package com.careerflow.strategy.dto;

import com.careerflow.strategy.StrategyActionType;
import com.careerflow.strategy.StrategyItemStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
public class StrategyItemResponse {
    private Long id;
    private Long opportunityId;
    private StrategyActionType actionType;
    private String title;
    private Integer sortOrder;
    private LocalDate dueDate;
    private StrategyItemStatus status;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
