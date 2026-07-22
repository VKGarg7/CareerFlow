package com.careerflow.application.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;

@Getter
@Builder
public class DailyTrendItem {
    private LocalDate date;
    private long count;
}
