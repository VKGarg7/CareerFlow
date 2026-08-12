package com.careerflow.timeline.dto;

import com.careerflow.actionitem.ActionableEntityType;
import com.careerflow.timeline.TimelineEventType;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class TimelineEventResponse {
    private Long id;
    private ActionableEntityType entityType;
    private Long entityId;
    private String entityLabel;
    private TimelineEventType eventType;
    private String description;
    private LocalDateTime occurredAt;
}
