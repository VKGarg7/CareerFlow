package com.careerflow.admin.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class SystemHealthResponse {
    private boolean databaseUp;
    private long databaseResponseTimeMs;
    private long uptimeMillis;
    private long usedMemoryMb;
    private long maxMemoryMb;
    private int availableProcessors;
}
