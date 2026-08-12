package com.careerflow.deadline.dto;

import com.careerflow.deadline.DeadlineStatus;
import com.careerflow.deadline.DeadlineType;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class DeadlineUpdateRequest {
    private String title;
    private DeadlineType type;
    private DeadlineStatus status;
    private LocalDateTime dueAt;
    private String notes;
}
