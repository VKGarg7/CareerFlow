package com.careerflow.strategy.dto;

import com.careerflow.strategy.StrategyActionType;
import com.careerflow.strategy.StrategyItemStatus;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class StrategyItemUpdateRequest {

    private StrategyActionType actionType;
    private String title;
    private LocalDate dueDate;
    private StrategyItemStatus status;
    private String notes;
    private Integer sortOrder;
}
