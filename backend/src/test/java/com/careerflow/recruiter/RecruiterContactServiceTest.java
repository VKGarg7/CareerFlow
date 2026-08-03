package com.careerflow.recruiter;

import com.careerflow.common.SecurityUtils;
import com.careerflow.common.WorkspaceAccessUtils;
import com.careerflow.exception.BadRequestException;
import com.careerflow.exception.DuplicateResourceException;
import com.careerflow.exception.ResourceNotFoundException;
import com.careerflow.recruiter.dto.RecruiterContactRequest;
import com.careerflow.recruiter.dto.RecruiterContactResponse;
import com.careerflow.recruiter.dto.RecruiterContactUpdateRequest;
import com.careerflow.recruiter.dto.RecruiterNoteEditRequest;
import com.careerflow.user.User;
import com.careerflow.workspace.Workspace;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@SuppressWarnings("null")
@ExtendWith(MockitoExtension.class)
class RecruiterContactServiceTest {

    @Mock
    private RecruiterContactRepository recruiterRepository;
    @Mock
    private RecruiterNoteRepository noteRepository;
    @Mock
    private WorkspaceAccessUtils workspaceAccessUtils;
    @Mock
    private SecurityUtils securityUtils;

    @InjectMocks
    private RecruiterContactService recruiterContactService;

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

    @Test
    void addRecruiter_throwsDuplicateResourceException_whenEmailAlreadyExists() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(recruiterRepository.existsByWorkspaceIdAndEmailIgnoreCase(WORKSPACE_ID, "jane@corp.com")).thenReturn(true);

        RecruiterContactRequest request = new RecruiterContactRequest();
        request.setName("Jane");
        request.setEmail("jane@corp.com");

        assertThatThrownBy(() -> recruiterContactService.addRecruiter(request, WORKSPACE_ID))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("jane@corp.com");

        verify(recruiterRepository, never()).save(any());
    }

    @Test
    void addRecruiter_savesWithDefaultStatus_whenStatusNotProvided() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(recruiterRepository.existsByWorkspaceIdAndEmailIgnoreCase(WORKSPACE_ID, "jane@corp.com")).thenReturn(false);
        when(workspaceAccessUtils.getOwnedWorkspace(WORKSPACE_ID, 1L)).thenReturn(workspace());
        when(recruiterRepository.save(any(RecruiterContact.class))).thenAnswer(invocation -> {
            RecruiterContact contact = invocation.getArgument(0);
            contact.setId(5L);
            return contact;
        });

        RecruiterContactRequest request = new RecruiterContactRequest();
        request.setName("Jane");
        request.setEmail("jane@corp.com");

        RecruiterContactResponse response = recruiterContactService.addRecruiter(request, WORKSPACE_ID);

        assertThat(response.getId()).isEqualTo(5L);
        assertThat(response.getStatus()).isEqualTo(RecruiterStatus.NEW);
    }

    @Test
    void getMyRecruiters_throwsBadRequestException_whenStatusInvalid() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);

        assertThatThrownBy(() -> recruiterContactService.getMyRecruiters(null, null, "NOT_A_STATUS", "name", "asc", 0, 10, WORKSPACE_ID))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("NOT_A_STATUS");
    }

    @Test
    void getMyRecruiters_throwsResourceNotFoundException_whenIdNotOwned() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(recruiterRepository.findByIdAndUserIdAndWorkspaceId(9L, 1L, WORKSPACE_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> recruiterContactService.getMyRecruiters(9L, null, null, null, null, 0, 10, WORKSPACE_ID))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void updateRecruiter_throwsDuplicateResourceException_whenNewEmailBelongsToAnotherRecruiter() {
        RecruiterContact recruiter = RecruiterContact.builder().user(currentUser).name("Jane").build();
        recruiter.setId(9L);

        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(recruiterRepository.findByIdAndUserIdAndWorkspaceId(9L, 1L, WORKSPACE_ID)).thenReturn(Optional.of(recruiter));
        when(recruiterRepository.existsByWorkspaceIdAndEmailIgnoreCaseAndIdNot(WORKSPACE_ID, "taken@corp.com", 9L)).thenReturn(true);

        RecruiterContactUpdateRequest request = new RecruiterContactUpdateRequest();
        request.setEmail("taken@corp.com");

        assertThatThrownBy(() -> recruiterContactService.updateRecruiter(9L, request, WORKSPACE_ID))
                .isInstanceOf(DuplicateResourceException.class);
    }

    @Test
    void updateRecruiter_clearsEmail_whenEmailSetToBlank() {
        RecruiterContact recruiter = RecruiterContact.builder().user(currentUser).name("Jane").email("old@corp.com").build();
        recruiter.setId(9L);

        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(recruiterRepository.findByIdAndUserIdAndWorkspaceId(9L, 1L, WORKSPACE_ID)).thenReturn(Optional.of(recruiter));
        when(noteRepository.findAllByRecruiterContactIdAndUserId(eq(9L), eq(1L), any(Sort.class))).thenReturn(List.of());

        RecruiterContactUpdateRequest request = new RecruiterContactUpdateRequest();
        request.setEmail("   ");

        RecruiterContactResponse response = recruiterContactService.updateRecruiter(9L, request, WORKSPACE_ID);

        assertThat(response.getEmail()).isNull();
        verify(recruiterRepository, never()).existsByWorkspaceIdAndEmailIgnoreCaseAndIdNot(anyLong(), anyString(), anyLong());
    }

    @Test
    void updateRecruiter_addNote_throwsBadRequestException_whenNoteBlank() {
        RecruiterContact recruiter = RecruiterContact.builder().user(currentUser).name("Jane").build();
        recruiter.setId(9L);

        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(recruiterRepository.findByIdAndUserIdAndWorkspaceId(9L, 1L, WORKSPACE_ID)).thenReturn(Optional.of(recruiter));

        RecruiterContactUpdateRequest request = new RecruiterContactUpdateRequest();
        request.setAddNote("   ");

        assertThatThrownBy(() -> recruiterContactService.updateRecruiter(9L, request, WORKSPACE_ID))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Note content cannot be empty");

        verify(noteRepository, never()).save(any());
    }

    @Test
    void updateRecruiter_addNotePrioritized_overDeleteAndEditNote() {
        RecruiterContact recruiter = RecruiterContact.builder().user(currentUser).name("Jane").build();
        recruiter.setId(9L);

        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(recruiterRepository.findByIdAndUserIdAndWorkspaceId(9L, 1L, WORKSPACE_ID)).thenReturn(Optional.of(recruiter));
        when(noteRepository.findAllByRecruiterContactIdAndUserId(eq(9L), eq(1L), any(Sort.class))).thenReturn(List.of());

        RecruiterContactUpdateRequest request = new RecruiterContactUpdateRequest();
        request.setAddNote("Follow up next week");
        request.setDeleteNoteId(42L);
        RecruiterNoteEditRequest edit = new RecruiterNoteEditRequest();
        edit.setId(7L);
        edit.setContent("edited");
        request.setEditNote(edit);

        recruiterContactService.updateRecruiter(9L, request, WORKSPACE_ID);

        verify(noteRepository).save(any(RecruiterNote.class));
        verify(noteRepository, never()).findByIdAndRecruiterContactIdAndUserId(anyLong(), anyLong(), anyLong());
        verify(noteRepository, never()).delete(any());
    }

    @Test
    void updateRecruiter_deleteNote_throwsResourceNotFoundException_whenNoteMissing() {
        RecruiterContact recruiter = RecruiterContact.builder().user(currentUser).name("Jane").build();
        recruiter.setId(9L);

        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(recruiterRepository.findByIdAndUserIdAndWorkspaceId(9L, 1L, WORKSPACE_ID)).thenReturn(Optional.of(recruiter));
        when(noteRepository.findByIdAndRecruiterContactIdAndUserId(42L, 9L, 1L)).thenReturn(Optional.empty());

        RecruiterContactUpdateRequest request = new RecruiterContactUpdateRequest();
        request.setDeleteNoteId(42L);

        assertThatThrownBy(() -> recruiterContactService.updateRecruiter(9L, request, WORKSPACE_ID))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void deleteRecruiter_softDeletes_whenOwned() {
        RecruiterContact recruiter = RecruiterContact.builder().user(currentUser).name("Jane").build();
        recruiter.setId(9L);

        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(recruiterRepository.findByIdAndUserIdAndWorkspaceId(9L, 1L, WORKSPACE_ID)).thenReturn(Optional.of(recruiter));

        recruiterContactService.deleteRecruiter(9L, WORKSPACE_ID);

        assertThat(recruiter.getDeletedAt()).isNotNull();
        verify(recruiterRepository).save(recruiter);
    }
}
