package com.careerflow.resume;

import com.careerflow.application.ApplicationRepository;
import com.careerflow.audit.AuditLogService;
import com.careerflow.common.SecurityUtils;
import com.careerflow.common.WorkspaceAccessUtils;
import com.careerflow.config.FileStorageService;
import com.careerflow.document.Document;
import com.careerflow.document.DocumentRepository;
import com.careerflow.exception.BadRequestException;
import com.careerflow.exception.ConflictException;
import com.careerflow.exception.ResourceNotFoundException;
import com.careerflow.resume.dto.ResumeRequest;
import com.careerflow.resume.dto.ResumeResponse;
import com.careerflow.resume.dto.ResumeUpdateRequest;
import com.careerflow.user.User;
import com.careerflow.workspace.Workspace;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@SuppressWarnings("null")
@ExtendWith(MockitoExtension.class)
class ResumeServiceTest {

    @Mock
    private ResumeRepository resumeRepository;
    @Mock
    private ApplicationRepository applicationRepository;
    @Mock
    private DocumentRepository documentRepository;
    @Mock
    private WorkspaceAccessUtils workspaceAccessUtils;
    @Mock
    private SecurityUtils securityUtils;
    @Mock
    private FileStorageService fileStorageService;
    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private ResumeService resumeService;

    private User currentUser;
    private static final Long WORKSPACE_ID = 99L;

    @BeforeEach
    void setUp() {
        currentUser = new User();
        currentUser.setId(1L);
    }

    private Workspace workspace() {
        Workspace workspace = new Workspace();
        workspace.setId(WORKSPACE_ID);
        return workspace;
    }

    private Document document() {
        return Document.builder()
                .id(50L)
                .originalName("resume.pdf")
                .storedPath("resume-library/abc.pdf")
                .fileSize(1024L)
                .contentType("application/pdf")
                .build();
    }

    @Test
    void uploadResume_savesAndReturnsResponse() {
        MockMultipartFile file = new MockMultipartFile("file", "resume.pdf", "application/pdf", "content".getBytes());

        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(workspaceAccessUtils.getOwnedWorkspace(WORKSPACE_ID, 1L)).thenReturn(workspace());
        when(fileStorageService.storeDocument(any(), eq("resume-library"))).thenReturn(document());
        when(resumeRepository.save(any(Resume.class))).thenAnswer(invocation -> {
            Resume resume = invocation.getArgument(0);
            resume.setId(10L);
            return resume;
        });

        ResumeRequest request = new ResumeRequest();
        request.setTitle("SDE Resume");
        request.setVersionTag("v2");
        request.setTargetRoleCategory("Backend");

        ResumeResponse response = resumeService.uploadResume(file, request, WORKSPACE_ID);

        assertThat(response.getId()).isEqualTo(10L);
        assertThat(response.getTitle()).isEqualTo("SDE Resume");
        assertThat(response.getVersionTag()).isEqualTo("v2");
        assertThat(response.getStatus()).isEqualTo(ResumeStatus.ACTIVE);
        assertThat(response.getOriginalName()).isEqualTo("resume.pdf");
        verify(auditLogService).log(eq(currentUser), any(), anyString());
    }

    @Test
    void uploadResume_rejectsDisallowedExtension() {
        MockMultipartFile file = new MockMultipartFile("file", "resume.exe", "application/octet-stream", "content".getBytes());
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(workspaceAccessUtils.getOwnedWorkspace(WORKSPACE_ID, 1L)).thenReturn(workspace());

        ResumeRequest request = new ResumeRequest();
        request.setTitle("Bad file");

        assertThatThrownBy(() -> resumeService.uploadResume(file, request, WORKSPACE_ID))
                .isInstanceOf(BadRequestException.class);

        verify(resumeRepository, never()).save(any());
    }

    @Test
    void updateResume_updatesFields_withoutClearingUnsetOnes() {
        Resume resume = Resume.builder().user(currentUser).workspace(workspace())
                .title("Old Title").versionTag("v1").document(document()).build();
        resume.setId(12L);

        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(resumeRepository.findByIdAndUserIdAndWorkspaceId(12L, 1L, WORKSPACE_ID)).thenReturn(Optional.of(resume));
        when(resumeRepository.save(any(Resume.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ResumeUpdateRequest request = new ResumeUpdateRequest();
        request.setStatus(ResumeStatus.INACTIVE);

        ResumeResponse response = resumeService.updateResume(12L, request, WORKSPACE_ID);

        assertThat(response.getStatus()).isEqualTo(ResumeStatus.INACTIVE);
        assertThat(response.getTitle()).isEqualTo("Old Title");
        assertThat(response.getVersionTag()).isEqualTo("v1");
    }

    @Test
    void updateResume_throwsResourceNotFoundException_whenNotOwnedByUser() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(resumeRepository.findByIdAndUserIdAndWorkspaceId(99L, 1L, WORKSPACE_ID)).thenReturn(Optional.empty());

        ResumeUpdateRequest request = new ResumeUpdateRequest();

        assertThatThrownBy(() -> resumeService.updateResume(99L, request, WORKSPACE_ID))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void deleteResume_throwsConflictException_whenUsedInApplicationsAndNotForced() {
        Resume resume = Resume.builder().user(currentUser).workspace(workspace()).title("SDE Resume").document(document()).build();
        resume.setId(5L);

        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(resumeRepository.findByIdAndUserIdAndWorkspaceId(5L, 1L, WORKSPACE_ID)).thenReturn(Optional.of(resume));
        when(applicationRepository.existsByResumeLibraryIdAndWorkspaceId(5L, WORKSPACE_ID)).thenReturn(true);

        assertThatThrownBy(() -> resumeService.deleteResume(5L, false, WORKSPACE_ID))
                .isInstanceOf(ConflictException.class);

        verify(resumeRepository, never()).save(any());
    }

    @Test
    void deleteResume_softDeletes_whenForced() {
        Resume resume = Resume.builder().user(currentUser).workspace(workspace()).title("SDE Resume").document(document()).build();
        resume.setId(5L);

        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(resumeRepository.findByIdAndUserIdAndWorkspaceId(5L, 1L, WORKSPACE_ID)).thenReturn(Optional.of(resume));
        when(applicationRepository.existsByResumeLibraryIdAndWorkspaceId(5L, WORKSPACE_ID)).thenReturn(true);
        when(resumeRepository.save(any(Resume.class))).thenAnswer(invocation -> invocation.getArgument(0));

        resumeService.deleteResume(5L, true, WORKSPACE_ID);

        verify(resumeRepository).save(argThat(r -> r.getDeletedAt() != null));
    }

    @Test
    void deleteResume_softDeletes_whenNotUsedAndNotForced() {
        Resume resume = Resume.builder().user(currentUser).workspace(workspace()).title("SDE Resume").document(document()).build();
        resume.setId(6L);

        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(resumeRepository.findByIdAndUserIdAndWorkspaceId(6L, 1L, WORKSPACE_ID)).thenReturn(Optional.of(resume));
        when(applicationRepository.existsByResumeLibraryIdAndWorkspaceId(6L, WORKSPACE_ID)).thenReturn(false);
        when(resumeRepository.save(any(Resume.class))).thenAnswer(invocation -> invocation.getArgument(0));

        resumeService.deleteResume(6L, false, WORKSPACE_ID);

        verify(resumeRepository).save(argThat(r -> r.getDeletedAt() != null));
    }
}
