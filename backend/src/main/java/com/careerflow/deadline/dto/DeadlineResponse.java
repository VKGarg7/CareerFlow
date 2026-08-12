package com.careerflow.deadline.dto;

import com.careerflow.actionitem.ActionableEntityType;
import com.careerflow.deadline.DeadlineStatus;
import com.careerflow.deadline.DeadlineType;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class DeadlineResponse {
    private Long id;
    private String title;
    private DeadlineType type;
    private DeadlineStatus status;
    private LocalDateTime dueAt;
    private boolean missed;
    private ActionableEntityType entityType;
    private Long entityId;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
