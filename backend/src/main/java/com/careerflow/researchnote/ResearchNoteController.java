package com.careerflow.researchnote;

import com.careerflow.common.PageResponse;
import com.careerflow.researchnote.dto.ResearchNoteRequest;
import com.careerflow.researchnote.dto.ResearchNoteResponse;
import com.careerflow.researchnote.dto.ResearchNoteUpdateRequest;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/research-notes")
@RequiredArgsConstructor
public class ResearchNoteController {

    private final ResearchNoteService researchNoteService;

    @PostMapping
    public ResponseEntity<ResearchNoteResponse> addNote(
            @Valid @RequestBody ResearchNoteRequest request,
            @RequestParam Long workspaceId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(researchNoteService.addNote(request, workspaceId));
    }

    @GetMapping
    public ResponseEntity<PageResponse<ResearchNoteResponse>> searchNotes(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String order,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam Long workspaceId) {
        return ResponseEntity.ok(researchNoteService.searchNotes(search, sortBy, order, page, size, workspaceId));
    }

    @GetMapping("/by-company/{companyId}")
    public ResponseEntity<List<ResearchNoteResponse>> getNotesForCompany(
            @PathVariable Long companyId,
            @RequestParam Long workspaceId) {
        return ResponseEntity.ok(researchNoteService.getNotesForCompany(companyId, workspaceId));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ResearchNoteResponse> updateNote(
            @PathVariable Long id,
            @Valid @RequestBody ResearchNoteUpdateRequest request,
            @RequestParam Long workspaceId) {
        return ResponseEntity.ok(researchNoteService.updateNote(id, request, workspaceId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNote(
            @PathVariable Long id,
            @RequestParam Long workspaceId) {
        researchNoteService.deleteNote(id, workspaceId);
        return ResponseEntity.noContent().build();
    }
}
