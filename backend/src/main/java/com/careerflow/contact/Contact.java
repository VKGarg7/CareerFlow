package com.careerflow.contact;

import com.careerflow.common.SoftDeleteEntity;
import com.careerflow.company.Company;
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
@Table(name = "contacts", indexes = {
        @Index(name = "idx_contacts_user_deleted", columnList = "user_id, deleted_at"),
        @Index(name = "idx_contacts_status", columnList = "status"),
        @Index(name = "idx_contacts_relationship_type", columnList = "relationship_type"),
        @Index(name = "idx_contacts_workspace", columnList = "workspace_id"),
        @Index(name = "idx_contacts_company_id", columnList = "company_id")
})
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
@SuperBuilder
public class Contact extends SoftDeleteEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "workspace_id")
    private Workspace workspace;

    @Column(nullable = false)
    private String name;

    private String email;
    private String phone;
    private String linkedIn;

    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "company_id")
    private Company company;

    private String companyName;

    private String jobTitle;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ContactStatus status = ContactStatus.NEW;

    @Enumerated(EnumType.STRING)
    @Column(name = "relationship_type")
    private ContactRelationshipType relationshipType;

    @Enumerated(EnumType.STRING)
    private RelationshipStrength relationshipStrength;

    @Enumerated(EnumType.STRING)
    private ContactSource source;

    private LocalDate lastInteractionDate;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Builder.Default
    @OneToMany(mappedBy = "contact", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ContactNote> interactionNotes = new ArrayList<>();
}
