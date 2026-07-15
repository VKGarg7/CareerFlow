package com.careerflow.common;

import lombok.Builder;
import lombok.Getter;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Getter
@Builder
public class StatusCountsResponse {
    private long total;
    private Map<String, Long> byStatus;

    public static <S extends Enum<S>> StatusCountsResponse fromGroupedCounts(List<? extends GroupedCountRow<S>> rows) {
        Map<String, Long> byStatus = rows.stream().collect(Collectors.toMap(
                row -> row.getStatus().name(),
                row -> row.getTotal(),
                (a, b) -> a,
                LinkedHashMap::new
        ));
        long total = byStatus.values().stream().mapToLong(value -> value.longValue()).sum();
        return StatusCountsResponse.builder().total(total).byStatus(byStatus).build();
    }
}
