package com.careerflow.auth.dto;

import com.careerflow.user.Role;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class LoginResponse {
    private String token;
    private Role role;
}
