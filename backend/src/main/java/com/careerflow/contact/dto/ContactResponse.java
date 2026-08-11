package com.careerflow.contact.dto;

import com.careerflow.contact.ContactRelationshipType;
import com.careerflow.contact.ContactSource;
import com.careerflow.contact.ContactStatus;
import com.careerflow.contact.RelationshipStrength;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class ContactResponse {
    private Long id;
    private String name;
    private String email;
    private String phone;
    private String linkedIn;
    private Long companyId;
    private String companyDisplayName;
    private String companyName;
    private String jobTitle;
    private ContactStatus status;
    private ContactRelationshipType relationshipType;
    private RelationshipStrength relationshipStrength;
    private ContactSource source;
    private LocalDate lastInteractionDate;
    private String notes;
    private int noteCount;
    private List<ContactNoteResponse> interactionNotes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
