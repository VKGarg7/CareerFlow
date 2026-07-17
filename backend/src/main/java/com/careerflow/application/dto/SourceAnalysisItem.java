package com.careerflow.application.dto;

import com.careerflow.application.ApplicationSource;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class SourceAnalysisItem {
    private ApplicationSource source;
    private long total;
    private long interviews;
    private long offers;
}
