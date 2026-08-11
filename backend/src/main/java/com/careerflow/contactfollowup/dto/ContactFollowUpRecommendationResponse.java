package com.careerflow.contactfollowup.dto;

import com.careerflow.contactfollowup.RecommendationStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ContactFollowUpRecommendationResponse {
    private Long id;
    private Long contactId;
    private String contactName;
    private Long triggeringOutreachEventId;
    private int thresholdDays;
    private String recommendedAction;
    private RecommendationStatus status;
    private LocalDateTime generatedAt;
    private LocalDateTime dismissedAt;
    private LocalDateTime convertedAt;
}
