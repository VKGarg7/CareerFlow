package com.careerflow.application.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.Map;

@Getter
@Builder
public class ApplicationStatsResponse {
    private long total;
    private Map<String, Long> byStatus;
    private long createdThisMonth;
    private long createdLastMonth;
}
