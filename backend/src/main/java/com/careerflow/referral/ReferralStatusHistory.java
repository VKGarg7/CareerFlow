package com.careerflow.referral;

import com.careerflow.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "referral_status_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReferralStatusHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "referral_id", nullable = false)
    private ReferralRequest referral;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    private ReferralStatus fromStatus;

    @Enumerated(EnumType.STRING)
    private ReferralStatus toStatus;

    @Column(nullable = false, updatable = false)
    private LocalDateTime changedAt;

    @Column(columnDefinition = "TEXT")
    private String note;

    // true = user-added note (no status change); false = auto-recorded status transition
    @Column(nullable = false)
    private boolean noteOnly;

    @PrePersist
    protected void onCreate() {
        changedAt = LocalDateTime.now();
    }
}
