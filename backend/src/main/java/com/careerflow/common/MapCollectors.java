package com.careerflow.common;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Small helper for the recurring "collect a list of Spring Data projection rows into a
 * Map keyed by one accessor and valued by another" shape used by the various
 * getMy*ByCompany()-style service methods (application counts, last activity, next
 * follow-up, etc). Mirrors the precedent set by {@link StatusCountsResponse#fromGroupedCounts}.
 */
public final class MapCollectors {

    private MapCollectors() {
    }

    public static <R, K, V> Map<K, V> toMap(List<R> rows, Function<R, K> keyFn, Function<R, V> valueFn) {
        return rows.stream().collect(Collectors.toMap(keyFn, valueFn));
    }
}
