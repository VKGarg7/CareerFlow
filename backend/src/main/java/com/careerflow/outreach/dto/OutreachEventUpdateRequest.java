package com.careerflow.outreach.dto;

import com.careerflow.outreach.OutreachChannel;
import com.careerflow.outreach.OutreachPurpose;
import com.careerflow.outreach.OutreachResponseStatus;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
public class OutreachEventUpdateRequest {

    private Long opportunityId;

    private Long applicationId;

    private LocalDateTime eventDateTime;

    private OutreachChannel channel;

    private OutreachPurpose purpose;

    @Size(max = 2000, message = "Message summary must be 2000 characters or fewer")
    private String messageSummary;

    private OutreachResponseStatus responseStatus;

    @Size(max = 300, message = "Next action must be 300 characters or fewer")
    private String nextAction;

    private LocalDate nextActionDate;
}
