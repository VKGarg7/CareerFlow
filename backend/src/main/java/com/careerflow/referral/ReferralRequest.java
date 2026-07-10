package com.careerflow.referral;

import com.careerflow.common.SoftDeleteEntity;
import com.careerflow.user.User;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDate;

@Entity
@Table(name = "referral_requests")
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
@SuperBuilder
public class ReferralRequest extends SoftDeleteEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // ── Referrer info ──────────────────────────────────────────────────────────
    @Column(nullable = false)
    private String referrerName;

    private String referrerEmail;

    private String referrerLinkedIn;

    @Column(nullable = false)
    private String referrerCompany;

    private String referrerJobTitle;

    // ── Role being applied for via referral ────────────────────────────────────
    @Column(nullable = false)
    private String targetRole;

    // ── Optional link to a job posting ────────────────────────────────────────
    private String jobPostingUrl;

    // ── Relationship context ───────────────────────────────────────────────────
    @Column(columnDefinition = "TEXT")
    private String relationshipContext;

    // ── Message sent to referrer ───────────────────────────────────────────────
    @Column(columnDefinition = "TEXT")
    private String messageToReferrer;

    // ── Tracking ───────────────────────────────────────────────────────────────
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ReferralStatus status = ReferralStatus.DRAFT;

    private LocalDate requestedDate;

    private LocalDate followUpDate;

    @Column(columnDefinition = "TEXT")
    private String notes;
}
