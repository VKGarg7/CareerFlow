package com.careerflow.followuprule.dto;

import com.careerflow.actionitem.ActionType;
import com.careerflow.followuprule.FollowUpTriggerEvent;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class FollowUpRuleResponse {
    private Long id;
    private String name;
    private FollowUpTriggerEvent triggerEvent;
    private int delayDays;
    private ActionType actionType;
    private String actionTitle;
    private boolean enabled;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
