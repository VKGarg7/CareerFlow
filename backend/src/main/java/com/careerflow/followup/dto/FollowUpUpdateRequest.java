package com.careerflow.followup.dto;

import com.careerflow.followup.FollowUpStatus;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class FollowUpUpdateRequest {

    private LocalDate followUpDate;
    private String note;
    private FollowUpStatus status;
}
