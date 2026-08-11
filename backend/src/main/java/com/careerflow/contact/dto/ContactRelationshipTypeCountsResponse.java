package com.careerflow.contact.dto;

import com.careerflow.common.GroupedCountRow;
import lombok.Builder;
import lombok.Getter;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Getter
@Builder
public class ContactRelationshipTypeCountsResponse {
    private long total;
    private Map<String, Long> byRelationshipType;

    public static <S extends Enum<S>> ContactRelationshipTypeCountsResponse fromGroupedCounts(List<? extends GroupedCountRow<S>> rows) {
        Map<String, Long> byRelationshipType = rows.stream().collect(Collectors.toMap(
                row -> row.getStatus().name(),
                GroupedCountRow::getTotal,
                (a, b) -> a,
                LinkedHashMap::new
        ));
        long total = byRelationshipType.values().stream().mapToLong(Long::longValue).sum();
        return ContactRelationshipTypeCountsResponse.builder().total(total).byRelationshipType(byRelationshipType).build();
    }
}
