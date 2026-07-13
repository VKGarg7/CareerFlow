package com.careerflow.followup;

import com.careerflow.application.JobApplication;
import com.careerflow.common.BaseEntity;
import com.careerflow.user.User;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDate;

@Entity
@Table(name = "follow_ups", indexes = {
        @Index(name = "idx_follow_ups_user_application", columnList = "user_id, application_id"),
        @Index(name = "idx_follow_ups_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@SuperBuilder
public class FollowUp extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "application_id", nullable = false)
    private JobApplication application;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private LocalDate followUpDate;

    @Column(columnDefinition = "TEXT")
    private String note;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private FollowUpStatus status = FollowUpStatus.PENDING;
}
