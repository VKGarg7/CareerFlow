package com.careerflow.outreach;

import com.careerflow.application.JobApplication;
import com.careerflow.common.SoftDeleteEntity;
import com.careerflow.contact.Contact;
import com.careerflow.opportunity.Opportunity;
import com.careerflow.user.User;
import com.careerflow.workspace.Workspace;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "outreach_events", indexes = {
        @Index(name = "idx_outreach_events_user_deleted", columnList = "user_id, deleted_at"),
        @Index(name = "idx_outreach_events_workspace", columnList = "workspace_id"),
        @Index(name = "idx_outreach_events_contact", columnList = "contact_id"),
        @Index(name = "idx_outreach_events_opportunity", columnList = "opportunity_id"),
        @Index(name = "idx_outreach_events_application", columnList = "application_id")
})
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
@SuperBuilder
public class OutreachEvent extends SoftDeleteEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "contact_id", nullable = false)
    private Contact contact;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "workspace_id", nullable = false)
    private Workspace workspace;

    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "opportunity_id")
    private Opportunity opportunity;

    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "application_id")
    private JobApplication application;

    @Column(nullable = false)
    private LocalDateTime eventDateTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OutreachChannel channel;

    @Enumerated(EnumType.STRING)
    private OutreachPurpose purpose;

    @Column(columnDefinition = "TEXT")
    private String messageSummary;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private OutreachResponseStatus responseStatus = OutreachResponseStatus.NO_RESPONSE;

    private String nextAction;

    private LocalDate nextActionDate;
}
