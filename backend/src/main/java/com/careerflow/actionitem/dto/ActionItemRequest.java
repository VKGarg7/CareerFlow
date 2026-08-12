package com.careerflow.actionitem.dto;

import com.careerflow.actionitem.ActionPriority;
import com.careerflow.actionitem.ActionStatus;
import com.careerflow.actionitem.ActionType;
import com.careerflow.actionitem.ActionableEntityType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class ActionItemRequest {

    @NotBlank(message = "Title is required")
    private String title;

    @NotNull(message = "Action type is required")
    private ActionType type;

    private ActionStatus status;
    private ActionPriority priority;
    private LocalDate dueDate;

    private ActionableEntityType entityType;
    private Long entityId;

    private String notes;
}
