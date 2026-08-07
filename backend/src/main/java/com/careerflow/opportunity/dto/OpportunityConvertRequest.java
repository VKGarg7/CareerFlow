package com.careerflow.opportunity.dto;

import com.careerflow.application.ApplicationSource;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class OpportunityConvertRequest {

    private LocalDate applicationDate;
    private LocalDate deadline;
    private ApplicationSource source;
}
