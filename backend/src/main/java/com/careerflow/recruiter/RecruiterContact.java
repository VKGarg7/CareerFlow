package com.careerflow.recruiter;

import com.careerflow.common.SoftDeleteEntity;
import com.careerflow.user.User;
import com.careerflow.workspace.Workspace;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "recruiter_contacts", indexes = {
        @Index(name = "idx_recruiter_contacts_user_deleted", columnList = "user_id, deleted_at"),
        @Index(name = "idx_recruiter_contacts_status", columnList = "status"),
        @Index(name = "idx_recruiter_contacts_workspace", columnList = "workspace_id")
})
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
@SuperBuilder
public class RecruiterContact extends SoftDeleteEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // Nullable for now: backfilled by WorkspaceBackfillRunner on boot, then
    // tightened to nullable = false once every existing row is confirmed backfilled.
    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "workspace_id")
    private Workspace workspace;

    @Column(nullable = false)
    private String name;

    private String email;
    private String phone;
    private String linkedIn;
    private String company;
    private String jobTitle;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private RecruiterStatus status = RecruiterStatus.NEW;

    @Enumerated(EnumType.STRING)
    private RecruiterSource source;

    private LocalDate lastContactedAt;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Builder.Default
    @OneToMany(mappedBy = "recruiterContact", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RecruiterNote> interactionNotes = new ArrayList<>();
}
