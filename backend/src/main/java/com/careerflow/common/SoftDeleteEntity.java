package com.careerflow.common;

import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;

/**
 * Subclasses must repeat {@code @SQLRestriction("deleted_at IS NULL")} on the
 * concrete {@code @Entity} class — Hibernate does not inherit this annotation
 * from a {@code @MappedSuperclass}, so placing it only here is a no-op.
 */
@MappedSuperclass
@Getter
@Setter
@SuperBuilder
public abstract class SoftDeleteEntity extends BaseEntity {

    private LocalDateTime deletedAt;

    protected SoftDeleteEntity() {}

    public void softDelete() {
        this.deletedAt = LocalDateTime.now();
    }
}
