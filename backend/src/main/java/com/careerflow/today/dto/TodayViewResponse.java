package com.careerflow.today.dto;

import com.careerflow.actionitem.dto.ActionItemResponse;
import com.careerflow.application.dto.ApplicationResponse;
import com.careerflow.deadline.dto.DeadlineResponse;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class TodayViewResponse {
    private List<ActionItemResponse> overdueActions;
    private List<ActionItemResponse> actionsDueToday;
    private List<TodayInterviewItem> interviewsThisWeek;
    private List<ApplicationResponse> staleApplications;
    private List<TodayReferralItem> pendingReferrals;
    private List<DeadlineResponse> approachingDeadlines;
    private int totalCount;
}
