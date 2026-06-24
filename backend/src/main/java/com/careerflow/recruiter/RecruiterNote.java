package com.careerflow.recruiter;

import com.careerflow.common.BaseEntity;
import com.careerflow.user.User;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "recruiter_notes")
@Getter
@Setter
@NoArgsConstructor
@SuperBuilder
public class RecruiterNote extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recruiter_contact_id", nullable = false)
    private RecruiterContact recruiterContact;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;
}
