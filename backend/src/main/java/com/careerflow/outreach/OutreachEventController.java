package com.careerflow.outreach;

import com.careerflow.common.PageResponse;
import com.careerflow.outreach.dto.OutreachEventRequest;
import com.careerflow.outreach.dto.OutreachEventResponse;
import com.careerflow.outreach.dto.OutreachEventUpdateRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/outreach-events")
@RequiredArgsConstructor
public class OutreachEventController {

    private final OutreachEventService outreachEventService;

    @PostMapping
    public ResponseEntity<OutreachEventResponse> create(
            @Valid @RequestBody OutreachEventRequest request,
            @RequestParam Long workspaceId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(outreachEventService.create(request, workspaceId));
    }

    @GetMapping
    public ResponseEntity<PageResponse<OutreachEventResponse>> list(
            @RequestParam(required = false) Long contactId,
            @RequestParam(required = false) Long opportunityId,
            @RequestParam(required = false) Long applicationId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam Long workspaceId) {
        return ResponseEntity.ok(outreachEventService.list(contactId, opportunityId, applicationId, page, size, workspaceId));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<OutreachEventResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody OutreachEventUpdateRequest request,
            @RequestParam Long workspaceId) {
        return ResponseEntity.ok(outreachEventService.update(id, request, workspaceId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @RequestParam Long workspaceId) {
        outreachEventService.delete(id, workspaceId);
        return ResponseEntity.noContent().build();
    }
}
