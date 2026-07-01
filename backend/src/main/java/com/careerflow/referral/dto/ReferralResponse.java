package com.careerflow.referral.dto;

import com.careerflow.referral.ReferralStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class ReferralResponse {
    private Long id;
    private String referrerName;
    private String referrerEmail;
    private String referrerLinkedIn;
    private String referrerCompany;
    private String referrerJobTitle;
    private String targetRole;
    private String jobPostingUrl;
    private String relationshipContext;
    private String messageToReferrer;
    private ReferralStatus status;
    private LocalDate requestedDate;
    private LocalDate followUpDate;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    // Null in list responses; populated on single-fetch and after status changes
    private List<ReferralStatusHistoryResponse> statusHistory;
}
