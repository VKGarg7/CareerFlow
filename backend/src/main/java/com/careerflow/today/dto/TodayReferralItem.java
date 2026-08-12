package com.careerflow.today.dto;

import com.careerflow.referral.ReferralStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;

@Getter
@Builder
public class TodayReferralItem {
    private Long id;
    private String contactName;
    private String targetRole;
    private ReferralStatus status;
    private LocalDate followUpDate;
    private boolean overdue;
}
