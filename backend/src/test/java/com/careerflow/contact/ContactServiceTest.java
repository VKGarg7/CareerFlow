package com.careerflow.contact;

import com.careerflow.common.SecurityUtils;
import com.careerflow.common.WorkspaceAccessUtils;
import com.careerflow.company.CompanyRepository;
import com.careerflow.contact.dto.ContactNoteEditRequest;
import com.careerflow.contact.dto.ContactRequest;
import com.careerflow.contact.dto.ContactResponse;
import com.careerflow.contact.dto.ContactUpdateRequest;
import com.careerflow.exception.BadRequestException;
import com.careerflow.exception.DuplicateResourceException;
import com.careerflow.exception.ResourceNotFoundException;
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
class ContactServiceTest {

    @Mock
    private ContactRepository contactRepository;
    @Mock
    private ContactNoteRepository noteRepository;
    @Mock
    private CompanyRepository companyRepository;
    @Mock
    private WorkspaceAccessUtils workspaceAccessUtils;
    @Mock
    private SecurityUtils securityUtils;

    @InjectMocks
    private ContactService contactService;

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
    void addContact_throwsDuplicateResourceException_whenEmailAlreadyExists() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(contactRepository.existsByWorkspaceIdAndEmailIgnoreCase(WORKSPACE_ID, "jane@corp.com")).thenReturn(true);

        ContactRequest request = new ContactRequest();
        request.setName("Jane");
        request.setEmail("jane@corp.com");

        assertThatThrownBy(() -> contactService.addContact(request, WORKSPACE_ID))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("jane@corp.com");

        verify(contactRepository, never()).save(any());
    }

    @Test
    void addContact_savesWithDefaultStatus_whenStatusNotProvided() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(contactRepository.existsByWorkspaceIdAndEmailIgnoreCase(WORKSPACE_ID, "jane@corp.com")).thenReturn(false);
        when(workspaceAccessUtils.getOwnedWorkspace(WORKSPACE_ID, 1L)).thenReturn(workspace());
        when(contactRepository.save(any(Contact.class))).thenAnswer(invocation -> {
            Contact contact = invocation.getArgument(0);
            contact.setId(5L);
            return contact;
        });

        ContactRequest request = new ContactRequest();
        request.setName("Jane");
        request.setEmail("jane@corp.com");

        ContactResponse response = contactService.addContact(request, WORKSPACE_ID);

        assertThat(response.getId()).isEqualTo(5L);
        assertThat(response.getStatus()).isEqualTo(ContactStatus.NEW);
    }

    @Test
    void addContact_setsRelationshipType_whenProvided() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(workspaceAccessUtils.getOwnedWorkspace(WORKSPACE_ID, 1L)).thenReturn(workspace());
        when(contactRepository.save(any(Contact.class))).thenAnswer(invocation -> {
            Contact contact = invocation.getArgument(0);
            contact.setId(6L);
            return contact;
        });

        ContactRequest request = new ContactRequest();
        request.setName("Jane");
        request.setRelationshipType(ContactRelationshipType.RECRUITER);

        ContactResponse response = contactService.addContact(request, WORKSPACE_ID);

        assertThat(response.getRelationshipType()).isEqualTo(ContactRelationshipType.RECRUITER);
    }

    @Test
    void addContact_throwsResourceNotFoundException_whenCompanyNotOwned() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(workspaceAccessUtils.getOwnedWorkspace(WORKSPACE_ID, 1L)).thenReturn(workspace());
        when(companyRepository.findByIdAndUserIdAndWorkspaceId(77L, 1L, WORKSPACE_ID)).thenReturn(Optional.empty());

        ContactRequest request = new ContactRequest();
        request.setName("Jane");
        request.setCompanyId(77L);

        assertThatThrownBy(() -> contactService.addContact(request, WORKSPACE_ID))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void getMyContacts_throwsBadRequestException_whenStatusInvalid() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);

        assertThatThrownBy(() -> contactService.getMyContacts(null, null, "NOT_A_STATUS", null, "name", "asc", 0, 10, WORKSPACE_ID))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("NOT_A_STATUS");
    }

    @Test
    void getMyContacts_throwsBadRequestException_whenRelationshipTypeInvalid() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);

        assertThatThrownBy(() -> contactService.getMyContacts(null, null, null, "NOT_A_TYPE", "name", "asc", 0, 10, WORKSPACE_ID))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("NOT_A_TYPE");
    }

    @Test
    void getMyContacts_throwsResourceNotFoundException_whenIdNotOwned() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(contactRepository.findByIdAndUserIdAndWorkspaceId(9L, 1L, WORKSPACE_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> contactService.getMyContacts(9L, null, null, null, null, null, 0, 10, WORKSPACE_ID))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void updateContact_throwsDuplicateResourceException_whenNewEmailBelongsToAnotherContact() {
        Contact contact = Contact.builder().user(currentUser).name("Jane").build();
        contact.setId(9L);

        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(contactRepository.findByIdAndUserIdAndWorkspaceId(9L, 1L, WORKSPACE_ID)).thenReturn(Optional.of(contact));
        when(contactRepository.existsByWorkspaceIdAndEmailIgnoreCaseAndIdNot(WORKSPACE_ID, "taken@corp.com", 9L)).thenReturn(true);

        ContactUpdateRequest request = new ContactUpdateRequest();
        request.setEmail("taken@corp.com");

        assertThatThrownBy(() -> contactService.updateContact(9L, request, WORKSPACE_ID))
                .isInstanceOf(DuplicateResourceException.class);
    }

    @Test
    void updateContact_clearsEmail_whenEmailSetToBlank() {
        Contact contact = Contact.builder().user(currentUser).name("Jane").email("old@corp.com").build();
        contact.setId(9L);

        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(contactRepository.findByIdAndUserIdAndWorkspaceId(9L, 1L, WORKSPACE_ID)).thenReturn(Optional.of(contact));
        when(noteRepository.findAllByContactIdAndUserId(eq(9L), eq(1L), any(Sort.class))).thenReturn(List.of());

        ContactUpdateRequest request = new ContactUpdateRequest();
        request.setEmail("   ");

        ContactResponse response = contactService.updateContact(9L, request, WORKSPACE_ID);

        assertThat(response.getEmail()).isNull();
        verify(contactRepository, never()).existsByWorkspaceIdAndEmailIgnoreCaseAndIdNot(anyLong(), anyString(), anyLong());
    }

    @Test
    void updateContact_updatesRelationshipTypeAndLastInteractionDate() {
        Contact contact = Contact.builder().user(currentUser).name("Jane").build();
        contact.setId(9L);

        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(contactRepository.findByIdAndUserIdAndWorkspaceId(9L, 1L, WORKSPACE_ID)).thenReturn(Optional.of(contact));
        when(noteRepository.findAllByContactIdAndUserId(eq(9L), eq(1L), any(Sort.class))).thenReturn(List.of());

        ContactUpdateRequest request = new ContactUpdateRequest();
        request.setRelationshipType(ContactRelationshipType.HIRING_MANAGER);
        request.setLastInteractionDate(java.time.LocalDate.of(2026, 8, 1));

        ContactResponse response = contactService.updateContact(9L, request, WORKSPACE_ID);

        assertThat(response.getRelationshipType()).isEqualTo(ContactRelationshipType.HIRING_MANAGER);
        assertThat(response.getLastInteractionDate()).isEqualTo(java.time.LocalDate.of(2026, 8, 1));
    }

    @Test
    void updateContact_addNote_throwsBadRequestException_whenNoteBlank() {
        Contact contact = Contact.builder().user(currentUser).name("Jane").build();
        contact.setId(9L);

        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(contactRepository.findByIdAndUserIdAndWorkspaceId(9L, 1L, WORKSPACE_ID)).thenReturn(Optional.of(contact));

        ContactUpdateRequest request = new ContactUpdateRequest();
        request.setAddNote("   ");

        assertThatThrownBy(() -> contactService.updateContact(9L, request, WORKSPACE_ID))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Note content cannot be empty");

        verify(noteRepository, never()).save(any());
    }

    @Test
    void updateContact_addNotePrioritized_overDeleteAndEditNote() {
        Contact contact = Contact.builder().user(currentUser).name("Jane").build();
        contact.setId(9L);

        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(contactRepository.findByIdAndUserIdAndWorkspaceId(9L, 1L, WORKSPACE_ID)).thenReturn(Optional.of(contact));
        when(noteRepository.findAllByContactIdAndUserId(eq(9L), eq(1L), any(Sort.class))).thenReturn(List.of());

        ContactUpdateRequest request = new ContactUpdateRequest();
        request.setAddNote("Follow up next week");
        request.setDeleteNoteId(42L);
        ContactNoteEditRequest edit = new ContactNoteEditRequest();
        edit.setId(7L);
        edit.setContent("edited");
        request.setEditNote(edit);

        contactService.updateContact(9L, request, WORKSPACE_ID);

        verify(noteRepository).save(any(ContactNote.class));
        verify(noteRepository, never()).findByIdAndContactIdAndUserId(anyLong(), anyLong(), anyLong());
        verify(noteRepository, never()).delete(any());
    }

    @Test
    void updateContact_deleteNote_throwsResourceNotFoundException_whenNoteMissing() {
        Contact contact = Contact.builder().user(currentUser).name("Jane").build();
        contact.setId(9L);

        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(contactRepository.findByIdAndUserIdAndWorkspaceId(9L, 1L, WORKSPACE_ID)).thenReturn(Optional.of(contact));
        when(noteRepository.findByIdAndContactIdAndUserId(42L, 9L, 1L)).thenReturn(Optional.empty());

        ContactUpdateRequest request = new ContactUpdateRequest();
        request.setDeleteNoteId(42L);

        assertThatThrownBy(() -> contactService.updateContact(9L, request, WORKSPACE_ID))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void deleteContact_softDeletes_whenOwned() {
        Contact contact = Contact.builder().user(currentUser).name("Jane").build();
        contact.setId(9L);

        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(contactRepository.findByIdAndUserIdAndWorkspaceId(9L, 1L, WORKSPACE_ID)).thenReturn(Optional.of(contact));

        contactService.deleteContact(9L, WORKSPACE_ID);

        assertThat(contact.getDeletedAt()).isNotNull();
        verify(contactRepository).save(contact);
    }

    @Test
    void getMyRelationshipTypeStats_returnsCountsFromRepository() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(contactRepository.countByRelationshipTypeGroupedForUser(1L, WORKSPACE_ID)).thenReturn(List.of());

        contactService.getMyRelationshipTypeStats(WORKSPACE_ID);

        verify(contactRepository).countByRelationshipTypeGroupedForUser(1L, WORKSPACE_ID);
    }

    @Test
    void getRelationshipTypes_returnsAllEnumValues() {
        List<ContactRelationshipType> types = contactService.getRelationshipTypes();

        assertThat(types).containsExactlyInAnyOrder(ContactRelationshipType.values());
    }
}
