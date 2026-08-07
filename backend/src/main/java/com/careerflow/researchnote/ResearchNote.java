package com.careerflow.researchnote;

import com.careerflow.common.SoftDeleteEntity;
import com.careerflow.company.Company;
import com.careerflow.user.User;
import com.careerflow.workspace.Workspace;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.SQLRestriction;

@Entity
@Table(name = "research_notes", indexes = {
        @Index(name = "idx_research_notes_user_deleted", columnList = "user_id, deleted_at"),
        @Index(name = "idx_research_notes_workspace", columnList = "workspace_id"),
        @Index(name = "idx_research_notes_company", columnList = "company_id")
})
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
@SuperBuilder
public class ResearchNote extends SoftDeleteEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "workspace_id", nullable = false)
    private Workspace workspace;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ResearchNoteSection section;

    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;
}
