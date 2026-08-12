package com.careerflow.actionitem.dto;

import com.careerflow.actionitem.ActionPriority;
import com.careerflow.actionitem.ActionStatus;
import com.careerflow.actionitem.ActionType;
import com.careerflow.actionitem.ActionableEntityType;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
public class ActionItemResponse {
    private Long id;
    private String title;
    private ActionType type;
    private ActionStatus status;
    private ActionPriority priority;
    private LocalDate dueDate;
    private LocalDate snoozedUntil;
    private boolean overdue;

    private ActionableEntityType entityType;
    private Long entityId;

    private String notes;
    private LocalDateTime completedAt;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
