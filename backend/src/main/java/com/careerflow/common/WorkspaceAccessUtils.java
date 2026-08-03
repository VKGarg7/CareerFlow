package com.careerflow.common;

import com.careerflow.exception.ResourceNotFoundException;
import com.careerflow.workspace.Workspace;
import com.careerflow.workspace.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Shared workspace-ownership lookup used by every entity scoped under a
 * workspace (Company, JobApplication, RecruiterContact, ReferralRequest) when
 * creating a new row, so a user can't attach data to a workspace they don't own.
 */
@Component
@RequiredArgsConstructor
public class WorkspaceAccessUtils {

    private final WorkspaceRepository workspaceRepository;

    public Workspace getOwnedWorkspace(Long workspaceId, Long userId) {
        return workspaceRepository.findByIdAndUserId(workspaceId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));
    }
}
