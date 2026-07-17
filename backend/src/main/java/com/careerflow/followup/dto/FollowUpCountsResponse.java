package com.careerflow.followup.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class FollowUpCountsResponse {
    private long overdue;
    private long dueToday;
    private long upcoming;
    private long completed;
}
