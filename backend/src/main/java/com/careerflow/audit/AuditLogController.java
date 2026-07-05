package com.careerflow.audit;

import com.careerflow.audit.dto.AuditLogResponse;
import com.careerflow.common.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/audit-logs")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditLogService auditLogService;
    private final SecurityUtils securityUtils;

    @GetMapping("/me")
    public ResponseEntity<List<AuditLogResponse>> getMyActivity(
            @RequestParam(required = false) String action) {
        Long userId = securityUtils.getCurrentUser().getId();
        return ResponseEntity.ok(auditLogService.getMyActivity(userId, action));
    }
}
