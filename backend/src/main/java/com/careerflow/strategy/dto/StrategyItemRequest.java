package com.careerflow.strategy.dto;

import com.careerflow.strategy.StrategyActionType;
import com.careerflow.strategy.StrategyItemStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class StrategyItemRequest {

    @NotNull(message = "Opportunity ID is required")
    private Long opportunityId;

    @NotNull(message = "Action type is required")
    private StrategyActionType actionType;

    @NotBlank(message = "Title is required")
    private String title;

    private LocalDate dueDate;
    private StrategyItemStatus status;
    private String notes;

    private Integer sortOrder;
}
