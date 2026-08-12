package com.careerflow.deadline.dto;

import com.careerflow.actionitem.ActionableEntityType;
import com.careerflow.deadline.DeadlineType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class DeadlineRequest {

    @NotBlank(message = "Title is required")
    private String title;

    @NotNull(message = "Deadline type is required")
    private DeadlineType type;

    @NotNull(message = "Due date/time is required")
    private LocalDateTime dueAt;

    @NotNull(message = "entityType is required")
    private ActionableEntityType entityType;

    @NotNull(message = "entityId is required")
    private Long entityId;

    private String notes;
}
