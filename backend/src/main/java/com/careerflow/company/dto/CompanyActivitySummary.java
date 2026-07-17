package com.careerflow.company.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDate;

@Getter
@AllArgsConstructor
public class CompanyActivitySummary {
    private LocalDate lastActivity;
    private LocalDate nextFollowUp;
}
