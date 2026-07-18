package com.careerflow.common;

import com.careerflow.exception.BadRequestException;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Sort;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SuppressWarnings("null")
class SortHelperTest {

    private static final Set<String> ALLOWED = Set.of("name", "createdAt");

    @Test
    void build_throwsBadRequestException_whenFieldNotAllowed() {
        assertThatThrownBy(() -> SortHelper.build("email", "asc", ALLOWED))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Invalid sortBy field");
    }

    @Test
    void build_throws_whenSortByIsNull() {
        // Set.of(...).contains(null) throws NullPointerException before the
        // BadRequestException branch is reached — callers must always pass a non-null sortBy.
        assertThatThrownBy(() -> SortHelper.build(null, "asc", ALLOWED))
                .isInstanceOf(NullPointerException.class);
    }

    @Test
    void build_returnsAscendingSort_whenOrderIsAscCaseInsensitive() {
        Sort sort = SortHelper.build("name", "ASC", ALLOWED);

        assertThat(sort.getOrderFor("name").getDirection()).isEqualTo(Sort.Direction.ASC);
    }

    @Test
    void build_defaultsToDescending_forAnyNonAscOrder() {
        Sort sort = SortHelper.build("name", "whatever", ALLOWED);

        assertThat(sort.getOrderFor("name").getDirection()).isEqualTo(Sort.Direction.DESC);
    }
}
