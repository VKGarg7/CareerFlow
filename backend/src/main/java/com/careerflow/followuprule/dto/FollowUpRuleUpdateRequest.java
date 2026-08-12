package com.careerflow.followuprule.dto;

import com.careerflow.actionitem.ActionType;
import com.careerflow.followuprule.FollowUpTriggerEvent;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FollowUpRuleUpdateRequest {
    private String name;
    private FollowUpTriggerEvent triggerEvent;
    private Integer delayDays;
    private ActionType actionType;
    private String actionTitle;
    private Boolean enabled;
}
