package com.careerflow.resume;

import com.careerflow.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "resume_link_history", indexes = {
        @Index(name = "idx_resume_link_history_entity", columnList = "entity_type, entity_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResumeLinkHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resume_id")
    private Resume resume;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LinkedEntityType entityType;

    @Column(nullable = false)
    private Long entityId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LinkAction action;

    private String previousResumeTitle;
    private String newResumeTitle;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
