package com.careerflow.referral;

import com.careerflow.common.PageResponse;
import com.careerflow.common.StatusCountsResponse;
import com.careerflow.referral.dto.ReferralNoteActionRequest;
import com.careerflow.referral.dto.ReferralRequestDto;
import com.careerflow.referral.dto.ReferralResponse;
import com.careerflow.referral.dto.ReferralStatusHistoryResponse;
import com.careerflow.referral.dto.ReferralUpdateRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/referrals")
@RequiredArgsConstructor
public class ReferralRequestController {

    private final ReferralRequestService referralService;

    @PostMapping
    public ResponseEntity<ReferralResponse> create(@Valid @RequestBody ReferralRequestDto request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(referralService.create(request));
    }

    @GetMapping
    public ResponseEntity<PageResponse<ReferralResponse>> getMyReferrals(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String order,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(referralService.getMyReferrals(search, status, sortBy, order, page, size));
    }

    @GetMapping("/stats")
    public ResponseEntity<StatusCountsResponse> getMyReferralStats() {
        return ResponseEntity.ok(referralService.getMyReferralStats());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReferralResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(referralService.getById(id));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ReferralResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody ReferralUpdateRequest request) {
        return ResponseEntity.ok(referralService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        referralService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/notes")
    public ResponseEntity<List<ReferralStatusHistoryResponse>> manageNote(
            @PathVariable Long id,
            @Valid @RequestBody ReferralNoteActionRequest request) {
        return ResponseEntity.ok(referralService.manageNote(id, request));
    }
}
