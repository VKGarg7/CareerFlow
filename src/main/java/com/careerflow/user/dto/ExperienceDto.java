package com.careerflow.user.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ExperienceDto {
    private String company;
    private String role;

    @Pattern(regexp = "^(0[1-9]|1[0-2])/\\d{4}$", message = "Start date must be in MM/YYYY format (e.g. 06/2022)")
    private String startDate;

    @Pattern(regexp = "^(0[1-9]|1[0-2])/\\d{4}$", message = "End date must be in MM/YYYY format (e.g. 06/2024)")
    private String endDate;

    private boolean currentlyWorking;
    private String description;

    @JsonIgnore
    @AssertTrue(message = "End date is required when not currently working")
    public boolean isEndDateValid() {
        return currentlyWorking || (endDate != null && !endDate.isBlank());
    }
}
