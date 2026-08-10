package com.careerflow.resume;

import com.careerflow.common.SoftDeleteEntity;
import com.careerflow.document.Document;
import com.careerflow.user.User;
import com.careerflow.workspace.Workspace;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.SQLRestriction;

@Entity
@Table(name = "resumes", indexes = {
        @Index(name = "idx_resumes_user_deleted", columnList = "user_id, deleted_at"),
        @Index(name = "idx_resumes_workspace", columnList = "workspace_id"),
        @Index(name = "idx_resumes_status", columnList = "status")
})
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
@SuperBuilder
public class Resume extends SoftDeleteEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "workspace_id", nullable = false)
    private Workspace workspace;

    @Column(nullable = false)
    private String title;

    private String versionTag;
    private String targetRoleCategory;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ResumeStatus status = ResumeStatus.ACTIVE;

    @OneToOne(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "document_id", nullable = false)
    private Document document;
}
