package com.careerflow.referral.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReferralNoteActionRequest {

    @NotBlank(message = "Action must not be blank")
    private String action; // ADD | EDIT | DELETE

    private Long noteId; // required for EDIT and DELETE

    @Size(max = 1000, message = "Note must be 1000 characters or fewer")
    private String note; // required for ADD and EDIT
}
