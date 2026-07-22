package com.careerflow.common;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@SuppressWarnings("null")
class MapCollectorsTest {

    private record Row(Long id, String value) {
    }

    @Test
    void toMap_collectsRowsByKeyAndValueFunctions() {
        List<Row> rows = List.of(new Row(1L, "a"), new Row(2L, "b"));

        Map<Long, String> result = MapCollectors.toMap(rows, Row::id, Row::value);

        assertThat(result).containsExactlyInAnyOrderEntriesOf(Map.of(1L, "a", 2L, "b"));
    }

    @Test
    void toMap_returnsEmptyMap_forEmptyList() {
        Map<Long, String> result = MapCollectors.toMap(List.of(), Row::id, Row::value);

        assertThat(result).isEmpty();
    }
}
