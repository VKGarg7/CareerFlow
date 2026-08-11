package com.careerflow.contact;

import com.careerflow.common.PageResponse;
import com.careerflow.common.StatusCountsResponse;
import com.careerflow.contact.dto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/contacts")
@RequiredArgsConstructor
public class ContactController {

    private final ContactService contactService;

    @PostMapping
    public ResponseEntity<ContactResponse> addContact(
            @Valid @RequestBody ContactRequest request,
            @RequestParam Long workspaceId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(contactService.addContact(request, workspaceId));
    }

    @GetMapping
    public ResponseEntity<PageResponse<ContactResponse>> getMyContacts(
            @RequestParam(required = false) Long id,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String relationshipType,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String order,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam Long workspaceId) {
        return ResponseEntity.ok(contactService.getMyContacts(id, search, status, relationshipType, sortBy, order, page, size, workspaceId));
    }

    @GetMapping("/stats")
    public ResponseEntity<StatusCountsResponse> getMyContactStats(@RequestParam Long workspaceId) {
        return ResponseEntity.ok(contactService.getMyContactStats(workspaceId));
    }

    @GetMapping("/stats/relationship-type")
    public ResponseEntity<ContactRelationshipTypeCountsResponse> getMyRelationshipTypeStats(@RequestParam Long workspaceId) {
        return ResponseEntity.ok(contactService.getMyRelationshipTypeStats(workspaceId));
    }

    @GetMapping("/sources")
    public ResponseEntity<java.util.List<ContactSource>> getMySources(@RequestParam Long workspaceId) {
        return ResponseEntity.ok(contactService.getMySources(workspaceId));
    }

    @GetMapping("/relationship-types")
    public ResponseEntity<java.util.List<ContactRelationshipType>> getRelationshipTypes() {
        return ResponseEntity.ok(contactService.getRelationshipTypes());
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ContactResponse> updateContact(
            @PathVariable Long id,
            @Valid @RequestBody ContactUpdateRequest request,
            @RequestParam Long workspaceId) {
        return ResponseEntity.ok(contactService.updateContact(id, request, workspaceId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteContact(
            @PathVariable Long id,
            @RequestParam Long workspaceId) {
        contactService.deleteContact(id, workspaceId);
        return ResponseEntity.noContent().build();
    }
}
