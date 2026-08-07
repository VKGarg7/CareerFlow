package com.careerflow.researchnote;

import com.careerflow.audit.AuditLogService;
import com.careerflow.common.SecurityUtils;
import com.careerflow.common.WorkspaceAccessUtils;
import com.careerflow.company.Company;
import com.careerflow.company.CompanyRepository;
import com.careerflow.exception.ResourceNotFoundException;
import com.careerflow.researchnote.dto.ResearchNoteRequest;
import com.careerflow.researchnote.dto.ResearchNoteResponse;
import com.careerflow.researchnote.dto.ResearchNoteUpdateRequest;
import com.careerflow.user.User;
import com.careerflow.workspace.Workspace;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@SuppressWarnings("null")
@ExtendWith(MockitoExtension.class)
class ResearchNoteServiceTest {

    @Mock
    private ResearchNoteRepository researchNoteRepository;
    @Mock
    private CompanyRepository companyRepository;
    @Mock
    private WorkspaceAccessUtils workspaceAccessUtils;
    @Mock
    private SecurityUtils securityUtils;
    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private ResearchNoteService researchNoteService;

    private User currentUser;
    private static final Long WORKSPACE_ID = 99L;
    private static final Long COMPANY_ID = 5L;

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

    private Company company() {
        Company company = Company.builder().user(currentUser).name("Acme").build();
        company.setId(COMPANY_ID);
        return company;
    }

    private ResearchNoteRequest request() {
        ResearchNoteRequest request = new ResearchNoteRequest();
        request.setCompanyId(COMPANY_ID);
        request.setSection(ResearchNoteSection.TECH_STACK);
        request.setTitle("Backend stack");
        request.setContent("Java, Spring Boot, Postgres.");
        return request;
    }

    @Test
    void addNote_savesAndReturnsResponse_whenCompanyOwnedInWorkspace() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(workspaceAccessUtils.getOwnedWorkspace(WORKSPACE_ID, 1L)).thenReturn(workspace());
        when(companyRepository.findByIdAndUserIdAndWorkspaceId(COMPANY_ID, 1L, WORKSPACE_ID)).thenReturn(Optional.of(company()));
        when(researchNoteRepository.save(any(ResearchNote.class))).thenAnswer(invocation -> {
            ResearchNote note = invocation.getArgument(0);
            note.setId(20L);
            return note;
        });

        ResearchNoteResponse response = researchNoteService.addNote(request(), WORKSPACE_ID);

        assertThat(response.getId()).isEqualTo(20L);
        assertThat(response.getCompanyId()).isEqualTo(COMPANY_ID);
        assertThat(response.getCompanyName()).isEqualTo("Acme");
        assertThat(response.getSection()).isEqualTo(ResearchNoteSection.TECH_STACK);
        assertThat(response.getContent()).isEqualTo("Java, Spring Boot, Postgres.");
        verify(researchNoteRepository).save(any(ResearchNote.class));
        verify(auditLogService).log(eq(currentUser), any(), anyString());
    }

    @Test
    void addNote_throwsResourceNotFoundException_whenCompanyNotOwnedInWorkspace() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(workspaceAccessUtils.getOwnedWorkspace(WORKSPACE_ID, 1L)).thenReturn(workspace());
        when(companyRepository.findByIdAndUserIdAndWorkspaceId(COMPANY_ID, 1L, WORKSPACE_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> researchNoteService.addNote(request(), WORKSPACE_ID))
                .isInstanceOf(ResourceNotFoundException.class);

        verify(researchNoteRepository, never()).save(any());
    }

    @Test
    void getNotesForCompany_returnsNotes_orderedByCreatedAt() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(companyRepository.findByIdAndUserIdAndWorkspaceId(COMPANY_ID, 1L, WORKSPACE_ID)).thenReturn(Optional.of(company()));

        ResearchNote note = ResearchNote.builder()
                .user(currentUser).workspace(workspace()).company(company())
                .section(ResearchNoteSection.COMPANY_SUMMARY).content("Summary text").build();
        note.setId(1L);
        when(researchNoteRepository.findAllByUserIdAndWorkspaceIdAndCompanyIdOrderByCreatedAtAsc(1L, WORKSPACE_ID, COMPANY_ID))
                .thenReturn(List.of(note));

        List<ResearchNoteResponse> notes = researchNoteService.getNotesForCompany(COMPANY_ID, WORKSPACE_ID);

        assertThat(notes).hasSize(1);
        assertThat(notes.get(0).getContent()).isEqualTo("Summary text");
    }

    @Test
    void updateNote_updatesOnlyProvidedFields() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        ResearchNote note = ResearchNote.builder()
                .user(currentUser).workspace(workspace()).company(company())
                .section(ResearchNoteSection.SALARY_NOTES).title("Old title").content("Old content").build();
        note.setId(7L);
        when(researchNoteRepository.findByIdAndUserIdAndWorkspaceId(7L, 1L, WORKSPACE_ID)).thenReturn(Optional.of(note));
        when(researchNoteRepository.save(any(ResearchNote.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ResearchNoteUpdateRequest update = new ResearchNoteUpdateRequest();
        update.setContent("New content");

        ResearchNoteResponse response = researchNoteService.updateNote(7L, update, WORKSPACE_ID);

        assertThat(response.getContent()).isEqualTo("New content");
        assertThat(response.getTitle()).isEqualTo("Old title");
        assertThat(response.getSection()).isEqualTo(ResearchNoteSection.SALARY_NOTES);
    }

    @Test
    void updateNote_throwsResourceNotFoundException_whenNoteNotOwnedByUser() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(researchNoteRepository.findByIdAndUserIdAndWorkspaceId(99L, 1L, WORKSPACE_ID)).thenReturn(Optional.empty());

        ResearchNoteUpdateRequest update = new ResearchNoteUpdateRequest();

        assertThatThrownBy(() -> researchNoteService.updateNote(99L, update, WORKSPACE_ID))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void deleteNote_softDeletesNote() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        ResearchNote note = ResearchNote.builder()
                .user(currentUser).workspace(workspace()).company(company())
                .section(ResearchNoteSection.OTHER).content("content").build();
        note.setId(3L);
        when(researchNoteRepository.findByIdAndUserIdAndWorkspaceId(3L, 1L, WORKSPACE_ID)).thenReturn(Optional.of(note));
        when(researchNoteRepository.save(any(ResearchNote.class))).thenAnswer(invocation -> invocation.getArgument(0));

        researchNoteService.deleteNote(3L, WORKSPACE_ID);

        verify(researchNoteRepository).save(argThat(n -> n.getDeletedAt() != null));
    }
}
