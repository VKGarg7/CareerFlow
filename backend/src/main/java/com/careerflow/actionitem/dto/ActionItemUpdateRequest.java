package com.careerflow.actionitem.dto;

import com.careerflow.actionitem.ActionPriority;
import com.careerflow.actionitem.ActionStatus;
import com.careerflow.actionitem.ActionType;
import com.careerflow.actionitem.ActionableEntityType;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class ActionItemUpdateRequest {

    private String title;
    private ActionType type;
    private ActionStatus status;
    private ActionPriority priority;
    private LocalDate dueDate;

    private ActionableEntityType entityType;
    private Long entityId;
    private Boolean unlinkEntity;

    private String notes;

    private LocalDate snoozedUntil;
}
