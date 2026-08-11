package com.careerflow.referral.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ReferralContactSummary {
    private Long id;
    private String name;
    private String email;
    private String linkedIn;
    private String company;
    private String jobTitle;
}
