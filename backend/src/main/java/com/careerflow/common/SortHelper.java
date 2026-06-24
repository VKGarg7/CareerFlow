package com.careerflow.common;

import com.careerflow.exception.BadRequestException;
import org.springframework.data.domain.Sort;

import java.util.Set;

public final class SortHelper {

    private SortHelper() {}

    public static Sort build(String sortBy, String order, Set<String> allowedFields) {
        if (!allowedFields.contains(sortBy))
            throw new BadRequestException("Invalid sortBy field. Allowed: " + allowedFields);
        return Sort.by(
                "asc".equalsIgnoreCase(order) ? Sort.Direction.ASC : Sort.Direction.DESC,
                sortBy
        );
    }
}
