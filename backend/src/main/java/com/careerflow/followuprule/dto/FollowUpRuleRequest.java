package com.careerflow.followuprule.dto;

import com.careerflow.actionitem.ActionType;
import com.careerflow.followuprule.FollowUpTriggerEvent;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FollowUpRuleRequest {

    @NotBlank(message = "Rule name is required")
    private String name;

    @NotNull(message = "Trigger event is required")
    private FollowUpTriggerEvent triggerEvent;

    @Min(value = 0, message = "delayDays cannot be negative")
    private Integer delayDays;

    @NotNull(message = "Action type is required")
    private ActionType actionType;

    @NotBlank(message = "Action title is required")
    private String actionTitle;

    private Boolean enabled;
}
