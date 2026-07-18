package com.careerflow.common;

import com.careerflow.exception.BadRequestException;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SuppressWarnings("null")
class PaginationHelperTest {

    private static final Set<String> ALLOWED = Set.of("name", "createdAt");

    @Test
    void build_throwsBadRequestException_whenSortByNotAllowed() {
        assertThatThrownBy(() -> PaginationHelper.build(0, 10, "notAField", "asc", ALLOWED))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Invalid sortBy field");
    }

    @Test
    void build_usesAscendingOrder_whenOrderIsAsc() {
        Pageable pageable = PaginationHelper.build(0, 10, "name", "asc", ALLOWED);

        Sort.Order order = pageable.getSort().getOrderFor("name");
        assertThat(order).isNotNull();
        assertThat(order.getDirection()).isEqualTo(Sort.Direction.ASC);
    }

    @Test
    void build_defaultsToDescendingOrder_whenOrderIsNotAsc() {
        Pageable pageable = PaginationHelper.build(0, 10, "name", "bogus", ALLOWED);

        Sort.Order order = pageable.getSort().getOrderFor("name");
        assertThat(order.getDirection()).isEqualTo(Sort.Direction.DESC);
    }

    @Test
    void build_clampsNegativePage_toZero() {
        Pageable pageable = PaginationHelper.build(-5, 10, "name", "asc", ALLOWED);

        assertThat(pageable.getPageNumber()).isZero();
    }

    @Test
    void build_usesDefaultSize_whenSizeIsZeroOrNegative() {
        Pageable pageable = PaginationHelper.build(0, 0, "name", "asc", ALLOWED);

        assertThat(pageable.getPageSize()).isEqualTo(PaginationHelper.DEFAULT_SIZE);
    }

    @Test
    void build_capsSize_atMaxSize() {
        Pageable pageable = PaginationHelper.build(0, 999999, "name", "asc", ALLOWED);

        assertThat(pageable.getPageSize()).isEqualTo(PaginationHelper.MAX_SIZE);
    }
}
