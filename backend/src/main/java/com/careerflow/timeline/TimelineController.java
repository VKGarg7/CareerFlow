package com.careerflow.timeline;

import com.careerflow.actionitem.ActionableEntityType;
import com.careerflow.common.PageResponse;
import com.careerflow.common.SecurityUtils;
import com.careerflow.timeline.dto.TimelineEventResponse;
import com.careerflow.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/timeline")
@RequiredArgsConstructor
public class TimelineController {

    private final TimelineService timelineService;
    private final SecurityUtils securityUtils;

    @GetMapping
    public ResponseEntity<PageResponse<TimelineEventResponse>> getForWorkspace(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        return ResponseEntity.ok(timelineService.getForWorkspace(user.getId(), workspaceId, page, size));
    }

    @GetMapping("/for-entity")
    public ResponseEntity<PageResponse<TimelineEventResponse>> getForEntity(
            @RequestParam ActionableEntityType entityType,
            @RequestParam Long entityId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        return ResponseEntity.ok(timelineService.getForEntity(user.getId(), workspaceId, entityType, entityId, page, size));
    }
}
