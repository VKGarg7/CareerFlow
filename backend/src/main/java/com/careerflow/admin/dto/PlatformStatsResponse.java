package com.careerflow.admin.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.Map;

@Getter
@Builder
public class PlatformStatsResponse {
    private long totalUsers;
    private long activeUsers;
    private long totalApplications;
    private long totalInterviews;
    private long totalCompanies;
    private long totalReferrals;
    private Map<String, Long> applicationsByStatus;
    private Map<String, Long> interviewsByOutcome;
    private Map<String, Long> referralsByStatus;
}
