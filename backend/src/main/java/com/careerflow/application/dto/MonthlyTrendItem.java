package com.careerflow.application.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class MonthlyTrendItem {
    private int year;
    private int month;
    private long count;
}
