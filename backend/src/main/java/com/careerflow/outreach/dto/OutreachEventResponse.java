package com.careerflow.outreach.dto;

import com.careerflow.outreach.OutreachChannel;
import com.careerflow.outreach.OutreachPurpose;
import com.careerflow.outreach.OutreachResponseStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
public class OutreachEventResponse {
    private Long id;
    private OutreachContactSummary contact;
    private Long opportunityId;
    private Long applicationId;
    private LocalDateTime eventDateTime;
    private OutreachChannel channel;
    private OutreachPurpose purpose;
    private String messageSummary;
    private OutreachResponseStatus responseStatus;
    private String nextAction;
    private LocalDate nextActionDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
