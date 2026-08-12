package com.careerflow.timeline;

import com.careerflow.actionitem.ActionableEntityType;
import com.careerflow.common.PageResponse;
import com.careerflow.common.PaginationHelper;
import com.careerflow.timeline.dto.TimelineEventResponse;
import com.careerflow.user.User;
import com.careerflow.workspace.Workspace;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.Set;

@Service
@RequiredArgsConstructor
public class TimelineService {

    private static final Set<String> SORTABLE_FIELDS = Set.of("occurredAt");

    private final TimelineEventRepository timelineEventRepository;

    /** Fire-and-forget: called by other services right after they save+audit-log a state change. */
    public void record(User user, Workspace workspace, ActionableEntityType entityType, Long entityId,
                        String entityLabel, TimelineEventType eventType, String description) {
        timelineEventRepository.save(TimelineEvent.builder()
                .user(user)
                .workspace(workspace)
                .entityType(entityType)
                .entityId(entityId)
                .entityLabel(entityLabel)
                .eventType(eventType)
                .description(description)
                .build());
    }

    public PageResponse<TimelineEventResponse> getForEntity(
            Long userId, Long workspaceId, ActionableEntityType entityType, Long entityId, int page, int size) {
        Pageable pageable = PaginationHelper.build(page, size, "occurredAt", "desc", SORTABLE_FIELDS);
        Page<TimelineEvent> results = timelineEventRepository
                .findAllByUserIdAndWorkspaceIdAndEntityTypeAndEntityIdOrderByOccurredAtDesc(userId, workspaceId, entityType, entityId, pageable);
        return PageResponse.of(results.map(this::toResponse));
    }

    public PageResponse<TimelineEventResponse> getForWorkspace(Long userId, Long workspaceId, int page, int size) {
        Pageable pageable = PaginationHelper.build(page, size, "occurredAt", "desc", SORTABLE_FIELDS);
        Page<TimelineEvent> results = timelineEventRepository
                .findAllByUserIdAndWorkspaceIdOrderByOccurredAtDesc(userId, workspaceId, pageable);
        return PageResponse.of(results.map(this::toResponse));
    }

    private TimelineEventResponse toResponse(TimelineEvent event) {
        return TimelineEventResponse.builder()
                .id(event.getId())
                .entityType(event.getEntityType())
                .entityId(event.getEntityId())
                .entityLabel(event.getEntityLabel())
                .eventType(event.getEventType())
                .description(event.getDescription())
                .occurredAt(event.getOccurredAt())
                .build();
    }
}
