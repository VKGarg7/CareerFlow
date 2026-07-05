package com.careerflow.audit;

import com.careerflow.audit.dto.AuditLogResponse;
import com.careerflow.exception.BadRequestException;
import com.careerflow.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Limit;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;

@SuppressWarnings("null")
@Service
@RequiredArgsConstructor
public class AuditLogService {

    private static final int MAX_RESULTS = 200;
    private static final Sort NEWEST_FIRST = Sort.by(Sort.Direction.DESC, "occurredAt");

    private final AuditLogRepository auditLogRepository;

    public void log(User actor, AuditAction action, String description) {
        auditLogRepository.save(AuditLog.builder()
                .user(actor)
                .actorEmail(actor != null ? actor.getEmail() : null)
                .action(action)
                .description(description)
                .build());
    }

    public List<AuditLogResponse> getMyActivity(Long userId, String action) {
        List<AuditLog> results = auditLogRepository.search(userId, parseAction(action), NEWEST_FIRST, Limit.of(MAX_RESULTS));
        return results.stream().map(this::toResponse).toList();
    }

    public List<AuditLogResponse> getPlatformActivity(String action) {
        List<AuditLog> results = auditLogRepository.search(null, parseAction(action), NEWEST_FIRST, Limit.of(MAX_RESULTS));
        return results.stream().map(this::toResponse).toList();
    }

    private AuditAction parseAction(String action) {
        if (action == null || action.isBlank()) return null;
        try {
            return AuditAction.valueOf(action.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid action value: " + action);
        }
    }

    private AuditLogResponse toResponse(AuditLog log) {
        return AuditLogResponse.builder()
                .id(log.getId())
                .actorEmail(log.getActorEmail())
                .action(log.getAction())
                .description(log.getDescription())
                .occurredAt(log.getOccurredAt())
                .build();
    }
}
