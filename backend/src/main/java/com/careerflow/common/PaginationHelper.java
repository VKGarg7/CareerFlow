package com.careerflow.common;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.util.Set;

@SuppressWarnings("null")
public final class PaginationHelper {

    public static final int DEFAULT_SIZE = 10;
    public static final int MAX_SIZE = 1000;

    private PaginationHelper() {}

    public static Pageable build(int page, int size, String sortBy, String order, Set<String> allowedFields) {
        Sort sort = SortHelper.build(sortBy, order, allowedFields);
        int safePage = Math.max(page, 0);
        int safeSize = size <= 0 ? DEFAULT_SIZE : Math.min(size, MAX_SIZE);
        return PageRequest.of(safePage, safeSize, sort);
    }
}
