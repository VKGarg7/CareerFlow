package com.careerflow.admin.dto;

import com.careerflow.user.Role;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserRoleUpdateRequest {

    @NotNull(message = "role is required")
    private Role role;
}
