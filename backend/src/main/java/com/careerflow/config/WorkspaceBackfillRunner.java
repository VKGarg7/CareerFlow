package com.careerflow.config;

import com.careerflow.application.ApplicationRepository;
import com.careerflow.company.CompanyRepository;
import com.careerflow.recruiter.RecruiterContactRepository;
import com.careerflow.referral.ReferralRequestRepository;
import com.careerflow.user.User;
import com.careerflow.user.UserRepository;
import com.careerflow.workspace.Workspace;
import com.careerflow.workspace.WorkspaceRepository;
import com.careerflow.workspace.WorkspaceStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Backfills workspace_id on every pre-existing Company/JobApplication/RecruiterContact/
 * ReferralRequest row, creating a "Default" workspace per user the first time it runs.
 * Safe to run on every boot (matches UserDataBackfillRunner's style): each repository's
 * backfillWorkspaceId only touches rows still NULL, so this is a no-op once complete.
 */
@SuppressWarnings("null")
@Component
@RequiredArgsConstructor
public class WorkspaceBackfillRunner implements CommandLineRunner {

    private final UserRepository userRepository;
    private final WorkspaceRepository workspaceRepository;
    private final CompanyRepository companyRepository;
    private final ApplicationRepository applicationRepository;
    private final RecruiterContactRepository recruiterContactRepository;
    private final ReferralRequestRepository referralRequestRepository;

    @Override
    @Transactional
    public void run(String... args) {
        for (User user : userRepository.findAll()) {
            Long defaultWorkspaceId = workspaceRepository.findByUserIdAndIsDefaultTrue(user.getId())
                    .map(Workspace::getId)
                    .orElseGet(() -> createDefaultWorkspace(user));
            companyRepository.backfillWorkspaceId(user.getId(), defaultWorkspaceId);
            applicationRepository.backfillWorkspaceId(user.getId(), defaultWorkspaceId);
            recruiterContactRepository.backfillWorkspaceId(user.getId(), defaultWorkspaceId);
            referralRequestRepository.backfillWorkspaceId(user.getId(), defaultWorkspaceId);
        }
    }

    private Long createDefaultWorkspace(User user) {
        Workspace workspace = Workspace.builder()
                .user(user)
                .name("Default")
                .status(WorkspaceStatus.ACTIVE)
                .isDefault(true)
                .build();
        return workspaceRepository.save(workspace).getId();
    }
}
