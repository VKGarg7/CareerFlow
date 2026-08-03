package com.careerflow.company;

import com.careerflow.common.PageResponse;
import com.careerflow.common.StatusCountsResponse;
import com.careerflow.company.dto.CompanyActivitySummary;
import com.careerflow.company.dto.CompanyRequest;
import com.careerflow.company.dto.CompanyResponse;
import com.careerflow.company.dto.CompanyUpdateRequest;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/companies")
@RequiredArgsConstructor
public class CompanyController {

    private final CompanyService companyService;

    @PostMapping
    public ResponseEntity<CompanyResponse> addCompany(
            @Valid @RequestBody CompanyRequest request,
            @RequestParam Long workspaceId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(companyService.addCompany(request, workspaceId));
    }

    @GetMapping
    public ResponseEntity<PageResponse<CompanyResponse>> getMyCompanies(
            @RequestParam(required = false) Long id,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) CompanyStatus status,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String order,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam Long workspaceId) {
        return ResponseEntity.ok(companyService.getMyCompanies(id, search, status, sortBy, order, page, size, workspaceId));
    }

    @GetMapping("/stats")
    public ResponseEntity<StatusCountsResponse> getMyCompanyStats(@RequestParam Long workspaceId) {
        return ResponseEntity.ok(companyService.getMyCompanyStats(workspaceId));
    }

    @GetMapping("/application-counts")
    public ResponseEntity<Map<Long, Long>> getMyApplicationCountsByCompany(@RequestParam Long workspaceId) {
        return ResponseEntity.ok(companyService.getMyApplicationCountsByCompany(workspaceId));
    }

    @GetMapping("/creation-trend")
    public ResponseEntity<Map<String, List<Long>>> getMyCreationTrend(
            @RequestParam(defaultValue = "7") int days,
            @RequestParam Long workspaceId) {
        return ResponseEntity.ok(companyService.getCreationTrend(days, workspaceId));
    }

    @GetMapping("/activity-summary")
    public ResponseEntity<Map<Long, CompanyActivitySummary>> getMyActivitySummary(@RequestParam Long workspaceId) {
        return ResponseEntity.ok(companyService.getMyActivitySummary(workspaceId));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<CompanyResponse> updateCompany(
            @PathVariable Long id,
            @Valid @RequestBody CompanyUpdateRequest request,
            @RequestParam Long workspaceId) {
        return ResponseEntity.ok(companyService.updateCompany(id, request, workspaceId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCompany(
            @PathVariable Long id,
            @RequestParam(defaultValue = "false") boolean force,
            @RequestParam Long workspaceId) {
        companyService.deleteCompany(id, force, workspaceId);
        return ResponseEntity.noContent().build();
    }
}
