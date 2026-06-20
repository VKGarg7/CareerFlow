package com.careerflow.user.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.Map;

@Getter
@AllArgsConstructor
public class ProfileUpdateResponse {
    private Map<String, FieldChange> updated;
}