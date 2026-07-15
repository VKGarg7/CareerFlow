package com.careerflow.audit;

import com.careerflow.audit.dto.AuditLogResponse;
import com.careerflow.common.PageResponse;
import com.careerflow.common.PaginationHelper;
import com.careerflow.exception.BadRequestException;
import com.careerflow.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

@SuppressWarnings("null")
@Service
@RequiredArgsConstructor
public class AuditLogService {

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

    public PageResponse<AuditLogResponse> getMyActivity(Long userId, String action, int page, int size) {
        Pageable pageable = pageable(page, size);
        Page<AuditLog> results = auditLogRepository.search(userId, parseAction(action), pageable);
        return PageResponse.of(results.map(this::toResponse));
    }

    public PageResponse<AuditLogResponse> getPlatformActivity(String action, int page, int size) {
        Pageable pageable = pageable(page, size);
        Page<AuditLog> results = auditLogRepository.search(null, parseAction(action), pageable);
        return PageResponse.of(results.map(this::toResponse));
    }

    private Pageable pageable(int page, int size) {
        int safePage = Math.max(page, 0);
        int safeSize = size <= 0 ? PaginationHelper.DEFAULT_SIZE : Math.min(size, PaginationHelper.MAX_SIZE);
        return PageRequest.of(safePage, safeSize, NEWEST_FIRST);
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
