package com.careerflow.recruiter;

import com.careerflow.common.SoftDeleteEntity;
import com.careerflow.user.User;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "recruiter_contacts")
@Getter
@Setter
@NoArgsConstructor
@SuperBuilder
public class RecruiterContact extends SoftDeleteEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

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
