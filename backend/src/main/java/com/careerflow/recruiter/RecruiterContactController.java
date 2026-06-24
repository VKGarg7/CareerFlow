package com.careerflow.recruiter;

import com.careerflow.recruiter.dto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recruiters")
@RequiredArgsConstructor
public class RecruiterContactController {

    private final RecruiterContactService recruiterService;

    @PostMapping
    public ResponseEntity<RecruiterContactResponse> addRecruiter(
            @Valid @RequestBody RecruiterContactRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(recruiterService.addRecruiter(request));
    }

    @GetMapping
    public ResponseEntity<List<RecruiterContactResponse>> getMyRecruiters(
            @RequestParam(required = false) Long id,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String order) {
        return ResponseEntity.ok(recruiterService.getMyRecruiters(id, search, status, sortBy, order));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<RecruiterContactResponse> updateRecruiter(
            @PathVariable Long id,
            @Valid @RequestBody RecruiterContactUpdateRequest request) {
        return ResponseEntity.ok(recruiterService.updateRecruiter(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRecruiter(@PathVariable Long id) {
        recruiterService.deleteRecruiter(id);
        return ResponseEntity.noContent().build();
    }
}
