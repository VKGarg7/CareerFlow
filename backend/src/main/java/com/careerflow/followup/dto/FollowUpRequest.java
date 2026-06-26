package com.careerflow.followup.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class FollowUpRequest {

    @NotNull(message = "Follow-up date is required")
    private LocalDate followUpDate;

    private String note;
}
