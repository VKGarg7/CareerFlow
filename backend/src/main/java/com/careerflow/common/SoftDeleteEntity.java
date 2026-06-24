package com.careerflow.common;

import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;

@MappedSuperclass
@SQLRestriction("deleted_at IS NULL")
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
