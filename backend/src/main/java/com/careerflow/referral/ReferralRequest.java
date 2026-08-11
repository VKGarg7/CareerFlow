package com.careerflow.referral;

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

@Entity
@Table(name = "referral_requests", indexes = {
        @Index(name = "idx_referral_requests_user_deleted", columnList = "user_id, deleted_at"),
        @Index(name = "idx_referral_requests_status", columnList = "status"),
        @Index(name = "idx_referral_requests_workspace", columnList = "workspace_id"),
        @Index(name = "idx_referral_requests_contact", columnList = "contact_id")
})
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
@SuperBuilder
public class ReferralRequest extends SoftDeleteEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "workspace_id")
    private Workspace workspace;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "contact_id", nullable = false)
    private Contact contact;

    @Column(nullable = false)
    private String targetRole;

    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "opportunity_id")
    private Opportunity opportunity;

    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "application_id")
    private JobApplication application;

    private String jobPostingUrl;

    @Column(columnDefinition = "TEXT")
    private String relationshipContext;

    @Column(columnDefinition = "TEXT")
    private String messageToReferrer;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ReferralStatus status = ReferralStatus.PLANNED;

    private LocalDate requestedDate;

    private LocalDate followUpDate;

    private LocalDate referralDate;

    private String proofUrl;

    @Column(columnDefinition = "TEXT")
    private String notes;
}
