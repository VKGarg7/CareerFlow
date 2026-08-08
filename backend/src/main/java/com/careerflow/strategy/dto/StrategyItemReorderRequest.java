package com.careerflow.strategy.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class StrategyItemReorderRequest {

    @NotEmpty(message = "Ordered item IDs are required")
    private List<Long> orderedItemIds;
}
