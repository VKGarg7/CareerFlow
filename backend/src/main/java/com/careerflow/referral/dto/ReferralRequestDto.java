package com.careerflow.referral.dto;

import com.careerflow.referral.ReferralStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.validator.constraints.URL;

import java.time.LocalDate;

@Getter
@Setter
public class ReferralRequestDto {

    @NotNull(message = "Contact is required")
    private Long contactId;

    @NotBlank(message = "Target role is required")
    @Size(max = 150, message = "Target role must be 150 characters or fewer")
    private String targetRole;

    private Long opportunityId;

    private Long applicationId;

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

    private LocalDate referralDate;

    @Size(max = 500, message = "Proof URL must be 500 characters or fewer")
    private String proofUrl;

    @Size(max = 2000, message = "Notes must be 2000 characters or fewer")
    private String notes;
}
