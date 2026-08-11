package com.careerflow.contact.dto;

import com.careerflow.contact.ContactRelationshipType;
import com.careerflow.contact.ContactSource;
import com.careerflow.contact.ContactStatus;
import com.careerflow.contact.RelationshipStrength;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.validator.constraints.URL;

import java.time.LocalDate;

@Getter
@Setter
public class ContactUpdateRequest {

    @Size(max = 100, message = "Name must be 100 characters or fewer")
    private String name;

    @Email(message = "Email must be a valid email address")
    @Size(max = 150, message = "Email must be 150 characters or fewer")
    private String email;

    @Pattern(
        regexp = "^[+]?[0-9()\\-\\s.]{7,20}$",
        message = "Phone must be 7–20 characters and contain only digits, spaces, +, -, (, ), or ."
    )
    private String phone;

    @URL(message = "LinkedIn must be a valid URL")
    @Size(max = 300, message = "LinkedIn URL must be 300 characters or fewer")
    private String linkedIn;

    private Long companyId;

    @Size(max = 150, message = "Company name must be 150 characters or fewer")
    private String companyName;

    @Size(max = 100, message = "Job title must be 100 characters or fewer")
    private String jobTitle;

    private ContactStatus status;

    private ContactRelationshipType relationshipType;

    private RelationshipStrength relationshipStrength;

    private ContactSource source;

    private LocalDate lastInteractionDate;

    @Size(max = 2000, message = "Notes must be 2000 characters or fewer")
    private String notes;

    @Size(max = 1000, message = "Note must be 1000 characters or fewer")
    private String addNote;

    private Long deleteNoteId;

    @Valid
    private ContactNoteEditRequest editNote;
}
