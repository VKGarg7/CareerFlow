package com.careerflow.user.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.constraints.AssertTrue;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ExperienceDto {
    private String company;
    private String role;
    private String startDate;
    private String endDate;
    private boolean currentlyWorking;
    private String description;

    @JsonIgnore
    @AssertTrue(message = "End date is required when not currently working")
    public boolean isEndDateValid() {
        return currentlyWorking || (endDate != null && !endDate.isBlank());
    }
}
