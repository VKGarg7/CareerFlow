package com.careerflow.admin;

import com.careerflow.admin.dto.AdminUserResponse;
import com.careerflow.admin.dto.PlatformStatsResponse;
import com.careerflow.admin.dto.SystemHealthResponse;
import com.careerflow.admin.dto.UserRoleUpdateRequest;
import com.careerflow.admin.dto.UserStatusUpdateRequest;
import com.careerflow.audit.AuditLogService;
import com.careerflow.audit.dto.AuditLogResponse;
import com.careerflow.common.PageResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;
    private final AuditLogService auditLogService;
    private final SystemHealthService systemHealthService;

    @GetMapping("/stats")
    public ResponseEntity<PlatformStatsResponse> getPlatformStats() {
        return ResponseEntity.ok(adminService.getPlatformStats());
    }

    @GetMapping("/users")
    public ResponseEntity<PageResponse<AdminUserResponse>> getAllUsers(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String order,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(adminService.getAllUsers(search, sortBy, order, page, size));
    }

    @PatchMapping("/users/{id}/status")
    public ResponseEntity<AdminUserResponse> updateUserStatus(
            @PathVariable Long id,
            @Valid @RequestBody UserStatusUpdateRequest request) {
        return ResponseEntity.ok(adminService.setUserActive(id, request.getActive()));
    }

    @PatchMapping("/users/{id}/role")
    public ResponseEntity<AdminUserResponse> updateUserRole(
            @PathVariable Long id,
            @Valid @RequestBody UserRoleUpdateRequest request) {
        return ResponseEntity.ok(adminService.setUserRole(id, request.getRole()));
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<PageResponse<AuditLogResponse>> getAuditLogs(
            @RequestParam(required = false) String action,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(auditLogService.getPlatformActivity(action, page, size));
    }

    @GetMapping("/health")
    public ResponseEntity<SystemHealthResponse> getSystemHealth() {
        return ResponseEntity.ok(systemHealthService.getHealth());
    }
}
