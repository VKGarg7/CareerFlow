package com.careerflow.contactfollowup;

import com.careerflow.common.PageResponse;
import com.careerflow.contactfollowup.dto.ContactFollowUpRecommendationResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/contact-follow-up-recommendations")
@RequiredArgsConstructor
public class ContactFollowUpRecommendationController {

    private final ContactFollowUpRecommendationService recommendationService;

    @GetMapping
    public ResponseEntity<PageResponse<ContactFollowUpRecommendationResponse>> list(
            @RequestParam(required = false) Integer thresholdDays,
            @RequestParam(required = false) RecommendationStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam Long workspaceId) {
        return ResponseEntity.ok(recommendationService.list(thresholdDays, status, page, size, workspaceId));
    }

    @PostMapping("/{id}/dismiss")
    public ResponseEntity<ContactFollowUpRecommendationResponse> dismiss(
            @PathVariable Long id,
            @RequestParam Long workspaceId) {
        return ResponseEntity.ok(recommendationService.dismiss(id, workspaceId));
    }

    @PostMapping("/{id}/convert")
    public ResponseEntity<ContactFollowUpRecommendationResponse> convert(
            @PathVariable Long id,
            @RequestParam Long workspaceId) {
        return ResponseEntity.ok(recommendationService.convert(id, workspaceId));
    }
}
