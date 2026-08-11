package com.careerflow.contactfollowup;

import com.careerflow.common.SoftDeleteEntity;
import com.careerflow.contact.Contact;
import com.careerflow.outreach.OutreachEvent;
import com.careerflow.user.User;
import com.careerflow.workspace.Workspace;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;

@Entity
@Table(name = "contact_follow_up_recommendations", indexes = {
        @Index(name = "idx_contact_followup_reco_user_deleted", columnList = "user_id, deleted_at"),
        @Index(name = "idx_contact_followup_reco_status", columnList = "status"),
        @Index(name = "idx_contact_followup_reco_workspace", columnList = "workspace_id"),
        @Index(name = "idx_contact_followup_reco_contact", columnList = "contact_id")
})
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
@SuperBuilder
public class ContactFollowUpRecommendation extends SoftDeleteEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "contact_id", nullable = false)
    private Contact contact;

    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "triggering_outreach_event_id")
    private OutreachEvent triggeringOutreachEvent;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "workspace_id", nullable = false)
    private Workspace workspace;

    @Column(nullable = false)
    private int thresholdDays;

    @Column(nullable = false)
    private String recommendedAction;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private RecommendationStatus status = RecommendationStatus.PENDING;

    @Column(nullable = false)
    private LocalDateTime generatedAt;

    private LocalDateTime dismissedAt;

    private LocalDateTime convertedAt;
}
