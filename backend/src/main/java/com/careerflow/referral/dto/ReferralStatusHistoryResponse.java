package com.careerflow.referral.dto;

import com.careerflow.referral.ReferralStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ReferralStatusHistoryResponse {
    private Long id;
    private ReferralStatus fromStatus;
    private ReferralStatus toStatus;
    private LocalDateTime changedAt;
    private String note;
    private boolean noteOnly;
}
