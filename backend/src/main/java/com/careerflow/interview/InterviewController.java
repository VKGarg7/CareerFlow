package com.careerflow.interview;

import com.careerflow.interview.dto.InterviewRequest;
import com.careerflow.interview.dto.InterviewResponse;
import com.careerflow.interview.dto.InterviewUpdateRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class InterviewController {

    private final InterviewService interviewService;

    @PostMapping("/api/applications/{applicationId}/interviews")
    public ResponseEntity<InterviewResponse> create(
            @PathVariable Long applicationId,
            @Valid @RequestBody InterviewRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(interviewService.create(applicationId, request));
    }

    @GetMapping("/api/applications/{applicationId}/interviews")
    public ResponseEntity<List<InterviewResponse>> getForApplication(@PathVariable Long applicationId) {
        return ResponseEntity.ok(interviewService.getForApplication(applicationId));
    }

    @PatchMapping("/api/interviews/{id}")
    public ResponseEntity<InterviewResponse> update(
            @PathVariable Long id,
            @RequestBody InterviewUpdateRequest request) {
        return ResponseEntity.ok(interviewService.update(id, request));
    }

    @DeleteMapping("/api/interviews/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        interviewService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
