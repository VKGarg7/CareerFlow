package com.careerflow.coverletter;

import com.careerflow.application.ApplicationRepository;
import com.careerflow.audit.AuditLogService;
import com.careerflow.common.SecurityUtils;
import com.careerflow.common.WorkspaceAccessUtils;
import com.careerflow.config.FileStorageService;
import com.careerflow.coverletter.dto.CoverLetterRequest;
import com.careerflow.coverletter.dto.CoverLetterResponse;
import com.careerflow.coverletter.dto.CoverLetterUpdateRequest;
import com.careerflow.document.Document;
import com.careerflow.document.DocumentRepository;
import com.careerflow.exception.BadRequestException;
import com.careerflow.exception.ConflictException;
import com.careerflow.exception.ResourceNotFoundException;
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
class CoverLetterServiceTest {

    @Mock
    private CoverLetterRepository coverLetterRepository;
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
    private CoverLetterService coverLetterService;

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
                .originalName("cover-letter.pdf")
                .storedPath("coverletter-library/abc.pdf")
                .fileSize(1024L)
                .contentType("application/pdf")
                .build();
    }

    @Test
    void uploadCoverLetter_savesAndReturnsResponse() {
        MockMultipartFile file = new MockMultipartFile("file", "cover-letter.pdf", "application/pdf", "content".getBytes());

        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(workspaceAccessUtils.getOwnedWorkspace(WORKSPACE_ID, 1L)).thenReturn(workspace());
        when(fileStorageService.storeDocument(any(), eq("coverletter-library"))).thenReturn(document());
        when(coverLetterRepository.save(any(CoverLetter.class))).thenAnswer(invocation -> {
            CoverLetter coverLetter = invocation.getArgument(0);
            coverLetter.setId(10L);
            return coverLetter;
        });

        CoverLetterRequest request = new CoverLetterRequest();
        request.setTitle("Backend Cover Letter");
        request.setTargetRoleCategory("Backend");

        CoverLetterResponse response = coverLetterService.uploadCoverLetter(file, request, WORKSPACE_ID);

        assertThat(response.getId()).isEqualTo(10L);
        assertThat(response.getTitle()).isEqualTo("Backend Cover Letter");
        assertThat(response.getStatus()).isEqualTo(CoverLetterStatus.ACTIVE);
        assertThat(response.getOriginalName()).isEqualTo("cover-letter.pdf");
        verify(auditLogService).log(eq(currentUser), any(), anyString());
    }

    @Test
    void uploadCoverLetter_rejectsDisallowedExtension() {
        MockMultipartFile file = new MockMultipartFile("file", "cover-letter.exe", "application/octet-stream", "content".getBytes());
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(workspaceAccessUtils.getOwnedWorkspace(WORKSPACE_ID, 1L)).thenReturn(workspace());

        CoverLetterRequest request = new CoverLetterRequest();
        request.setTitle("Bad file");

        assertThatThrownBy(() -> coverLetterService.uploadCoverLetter(file, request, WORKSPACE_ID))
                .isInstanceOf(BadRequestException.class);

        verify(coverLetterRepository, never()).save(any());
    }

    @Test
    void updateCoverLetter_updatesFields_withoutClearingUnsetOnes() {
        CoverLetter coverLetter = CoverLetter.builder().user(currentUser).workspace(workspace())
                .title("Old Title").targetRoleCategory("Backend").document(document()).build();
        coverLetter.setId(12L);

        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(coverLetterRepository.findByIdAndUserIdAndWorkspaceId(12L, 1L, WORKSPACE_ID)).thenReturn(Optional.of(coverLetter));
        when(coverLetterRepository.save(any(CoverLetter.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CoverLetterUpdateRequest request = new CoverLetterUpdateRequest();
        request.setStatus(CoverLetterStatus.INACTIVE);

        CoverLetterResponse response = coverLetterService.updateCoverLetter(12L, request, WORKSPACE_ID);

        assertThat(response.getStatus()).isEqualTo(CoverLetterStatus.INACTIVE);
        assertThat(response.getTitle()).isEqualTo("Old Title");
        assertThat(response.getTargetRoleCategory()).isEqualTo("Backend");
    }

    @Test
    void updateCoverLetter_throwsResourceNotFoundException_whenNotOwnedByUser() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(coverLetterRepository.findByIdAndUserIdAndWorkspaceId(99L, 1L, WORKSPACE_ID)).thenReturn(Optional.empty());

        CoverLetterUpdateRequest request = new CoverLetterUpdateRequest();

        assertThatThrownBy(() -> coverLetterService.updateCoverLetter(99L, request, WORKSPACE_ID))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void deleteCoverLetter_throwsConflictException_whenUsedInApplicationsAndNotForced() {
        CoverLetter coverLetter = CoverLetter.builder().user(currentUser).workspace(workspace()).title("Cover Letter").document(document()).build();
        coverLetter.setId(5L);

        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(coverLetterRepository.findByIdAndUserIdAndWorkspaceId(5L, 1L, WORKSPACE_ID)).thenReturn(Optional.of(coverLetter));
        when(applicationRepository.existsByCoverLetterLibraryIdAndWorkspaceId(5L, WORKSPACE_ID)).thenReturn(true);

        assertThatThrownBy(() -> coverLetterService.deleteCoverLetter(5L, false, WORKSPACE_ID))
                .isInstanceOf(ConflictException.class);

        verify(coverLetterRepository, never()).save(any());
    }

    @Test
    void deleteCoverLetter_softDeletes_whenForced() {
        CoverLetter coverLetter = CoverLetter.builder().user(currentUser).workspace(workspace()).title("Cover Letter").document(document()).build();
        coverLetter.setId(5L);

        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(coverLetterRepository.findByIdAndUserIdAndWorkspaceId(5L, 1L, WORKSPACE_ID)).thenReturn(Optional.of(coverLetter));
        when(applicationRepository.existsByCoverLetterLibraryIdAndWorkspaceId(5L, WORKSPACE_ID)).thenReturn(true);
        when(coverLetterRepository.save(any(CoverLetter.class))).thenAnswer(invocation -> invocation.getArgument(0));

        coverLetterService.deleteCoverLetter(5L, true, WORKSPACE_ID);

        verify(coverLetterRepository).save(argThat(r -> r.getDeletedAt() != null));
    }

    @Test
    void deleteCoverLetter_softDeletes_whenNotUsedAndNotForced() {
        CoverLetter coverLetter = CoverLetter.builder().user(currentUser).workspace(workspace()).title("Cover Letter").document(document()).build();
        coverLetter.setId(6L);

        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(coverLetterRepository.findByIdAndUserIdAndWorkspaceId(6L, 1L, WORKSPACE_ID)).thenReturn(Optional.of(coverLetter));
        when(applicationRepository.existsByCoverLetterLibraryIdAndWorkspaceId(6L, WORKSPACE_ID)).thenReturn(false);
        when(coverLetterRepository.save(any(CoverLetter.class))).thenAnswer(invocation -> invocation.getArgument(0));

        coverLetterService.deleteCoverLetter(6L, false, WORKSPACE_ID);

        verify(coverLetterRepository).save(argThat(r -> r.getDeletedAt() != null));
    }
}
