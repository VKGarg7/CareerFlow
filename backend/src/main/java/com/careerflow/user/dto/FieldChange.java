package com.careerflow.user.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class FieldChange {
    private Object from;
    private Object to;
}