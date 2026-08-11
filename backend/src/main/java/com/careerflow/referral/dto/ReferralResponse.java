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
    private ReferralContactSummary contact;
    private String targetRole;
    private Long opportunityId;
    private Long applicationId;
    private String jobPostingUrl;
    private String relationshipContext;
    private String messageToReferrer;
    private ReferralStatus status;
    private LocalDate requestedDate;
    private LocalDate followUpDate;
    private LocalDate referralDate;
    private String proofUrl;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<ReferralStatusHistoryResponse> statusHistory;
}
