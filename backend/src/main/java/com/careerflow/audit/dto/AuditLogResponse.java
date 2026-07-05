package com.careerflow.audit.dto;

import com.careerflow.audit.AuditAction;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class AuditLogResponse {
    private Long id;
    private String actorEmail;
    private AuditAction action;
    private String description;
    private LocalDateTime occurredAt;
}
