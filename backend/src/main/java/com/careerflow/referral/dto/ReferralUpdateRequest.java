package com.careerflow.referral.dto;

import com.careerflow.referral.ReferralStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.validator.constraints.URL;

import java.time.LocalDate;

@Getter
@Setter
public class ReferralUpdateRequest {

    @Size(max = 100, message = "Referrer name must be 100 characters or fewer")
    private String referrerName;

    @Email(message = "Referrer email must be a valid email address")
    @Size(max = 150, message = "Referrer email must be 150 characters or fewer")
    private String referrerEmail;

    @URL(message = "Referrer LinkedIn must be a valid URL")
    @Size(max = 300, message = "Referrer LinkedIn URL must be 300 characters or fewer")
    private String referrerLinkedIn;

    @Size(max = 150, message = "Referrer company must be 150 characters or fewer")
    private String referrerCompany;

    @Size(max = 100, message = "Referrer job title must be 100 characters or fewer")
    private String referrerJobTitle;

    @Size(max = 150, message = "Target role must be 150 characters or fewer")
    private String targetRole;

    @URL(message = "Job posting URL must be a valid URL")
    @Size(max = 500, message = "Job posting URL must be 500 characters or fewer")
    private String jobPostingUrl;

    @Size(max = 1000, message = "Relationship context must be 1000 characters or fewer")
    private String relationshipContext;

    @Size(max = 3000, message = "Message to referrer must be 3000 characters or fewer")
    private String messageToReferrer;

    private ReferralStatus status;

    private LocalDate requestedDate;

    private LocalDate followUpDate;

    @Size(max = 2000, message = "Notes must be 2000 characters or fewer")
    private String notes;

    // Optional note explaining why the status changed (recorded in history)
    @Size(max = 500, message = "Status note must be 500 characters or fewer")
    private String statusNote;
}
