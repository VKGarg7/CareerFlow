package com.careerflow.referral;

import com.careerflow.application.ApplicationRepository;
import com.careerflow.audit.AuditLogService;
import com.careerflow.common.SecurityUtils;
import com.careerflow.common.WorkspaceAccessUtils;
import com.careerflow.contact.Contact;
import com.careerflow.contact.ContactRepository;
import com.careerflow.exception.BadRequestException;
import com.careerflow.exception.DuplicateResourceException;
import com.careerflow.exception.ResourceNotFoundException;
import com.careerflow.opportunity.Opportunity;
import com.careerflow.opportunity.OpportunityRepository;
import com.careerflow.referral.dto.ReferralNoteActionRequest;
import com.careerflow.referral.dto.ReferralRequestDto;
import com.careerflow.referral.dto.ReferralResponse;
import com.careerflow.referral.dto.ReferralUpdateRequest;
import com.careerflow.followuprule.FollowUpRuleService;
import com.careerflow.timeline.TimelineService;
import com.careerflow.user.User;
import com.careerflow.workspace.Workspace;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@SuppressWarnings("null")
@ExtendWith(MockitoExtension.class)
class ReferralRequestServiceTest {

    @Mock
    private ReferralRequestRepository referralRepository;
    @Mock
    private ReferralStatusHistoryRepository historyRepository;
    @Mock
    private ContactRepository contactRepository;
    @Mock
    private OpportunityRepository opportunityRepository;
    @Mock
    private ApplicationRepository applicationRepository;
    @Mock
    private WorkspaceAccessUtils workspaceAccessUtils;
    @Mock
    private SecurityUtils securityUtils;
    @Mock
    private AuditLogService auditLogService;
    @Mock
    private TimelineService timelineService;
    @Mock
    private FollowUpRuleService followUpRuleService;

    @InjectMocks
    private ReferralRequestService referralRequestService;

    private User currentUser;
    private static final Long WORKSPACE_ID = 99L;
    private static final Long CONTACT_ID = 5L;

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

    private Contact contact() {
        Contact contact = Contact.builder().user(currentUser).name("Alex").companyName("Acme").build();
        contact.setId(CONTACT_ID);
        return contact;
    }

    private ReferralRequestDto validCreateDto() {
        ReferralRequestDto dto = new ReferralRequestDto();
        dto.setContactId(CONTACT_ID);
        dto.setTargetRole("Backend Engineer");
        return dto;
    }

    private void stubOwnedContact() {
        when(contactRepository.findByIdAndUserIdAndWorkspaceId(CONTACT_ID, 1L, WORKSPACE_ID)).thenReturn(Optional.of(contact()));
    }

    @Test
    void create_throwsResourceNotFoundException_whenContactNotOwned() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(workspaceAccessUtils.getOwnedWorkspace(WORKSPACE_ID, 1L)).thenReturn(workspace());
        when(contactRepository.findByIdAndUserIdAndWorkspaceId(CONTACT_ID, 1L, WORKSPACE_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> referralRequestService.create(validCreateDto(), WORKSPACE_ID))
                .isInstanceOf(ResourceNotFoundException.class);

        verify(referralRepository, never()).save(any());
    }

    @Test
    void create_throwsDuplicateResourceException_whenSameContactAndRoleAlreadyExists() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(workspaceAccessUtils.getOwnedWorkspace(WORKSPACE_ID, 1L)).thenReturn(workspace());
        stubOwnedContact();
        when(referralRepository.existsByWorkspaceIdAndContactIdAndTargetRoleIgnoreCase(
                WORKSPACE_ID, CONTACT_ID, "Backend Engineer")).thenReturn(true);

        assertThatThrownBy(() -> referralRequestService.create(validCreateDto(), WORKSPACE_ID))
                .isInstanceOf(DuplicateResourceException.class);

        verify(referralRepository, never()).save(any());
    }

    @Test
    void create_savesWithPlannedStatus_whenStatusNotProvided() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(workspaceAccessUtils.getOwnedWorkspace(WORKSPACE_ID, 1L)).thenReturn(workspace());
        stubOwnedContact();
        when(referralRepository.existsByWorkspaceIdAndContactIdAndTargetRoleIgnoreCase(any(), any(), any()))
                .thenReturn(false);
        when(referralRepository.save(any(ReferralRequest.class))).thenAnswer(invocation -> {
            ReferralRequest referral = invocation.getArgument(0);
            referral.setId(11L);
            return referral;
        });

        ReferralResponse response = referralRequestService.create(validCreateDto(), WORKSPACE_ID);

        assertThat(response.getId()).isEqualTo(11L);
        assertThat(response.getStatus()).isEqualTo(ReferralStatus.PLANNED);
        assertThat(response.getContact().getId()).isEqualTo(CONTACT_ID);
        verify(historyRepository).save(any(ReferralStatusHistory.class));
    }

    @Test
    void create_resolvesOptionalOpportunityAndApplication_whenProvided() {
        Opportunity opportunity = new Opportunity();
        opportunity.setId(21L);

        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(workspaceAccessUtils.getOwnedWorkspace(WORKSPACE_ID, 1L)).thenReturn(workspace());
        stubOwnedContact();
        when(referralRepository.existsByWorkspaceIdAndContactIdAndTargetRoleIgnoreCase(any(), any(), any()))
                .thenReturn(false);
        when(opportunityRepository.findByIdAndUserIdAndWorkspaceId(21L, 1L, WORKSPACE_ID)).thenReturn(Optional.of(opportunity));
        when(referralRepository.save(any(ReferralRequest.class))).thenAnswer(invocation -> {
            ReferralRequest referral = invocation.getArgument(0);
            referral.setId(12L);
            return referral;
        });

        ReferralRequestDto dto = validCreateDto();
        dto.setOpportunityId(21L);

        ReferralResponse response = referralRequestService.create(dto, WORKSPACE_ID);

        assertThat(response.getOpportunityId()).isEqualTo(21L);
    }

    @Test
    void create_throwsResourceNotFoundException_whenOpportunityNotOwned() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(workspaceAccessUtils.getOwnedWorkspace(WORKSPACE_ID, 1L)).thenReturn(workspace());
        stubOwnedContact();
        when(referralRepository.existsByWorkspaceIdAndContactIdAndTargetRoleIgnoreCase(any(), any(), any()))
                .thenReturn(false);
        when(opportunityRepository.findByIdAndUserIdAndWorkspaceId(21L, 1L, WORKSPACE_ID)).thenReturn(Optional.empty());

        ReferralRequestDto dto = validCreateDto();
        dto.setOpportunityId(21L);

        assertThatThrownBy(() -> referralRequestService.create(dto, WORKSPACE_ID))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void getMyReferrals_throwsBadRequestException_whenStatusInvalid() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);

        assertThatThrownBy(() -> referralRequestService.getMyReferrals(null, "NOT_A_STATUS", "targetRole", "asc", 0, 10, WORKSPACE_ID))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("NOT_A_STATUS");
    }

    @Test
    void update_throwsResourceNotFoundException_whenNotOwned() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(referralRepository.findByIdAndUserIdAndWorkspaceId(9L, 1L, WORKSPACE_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> referralRequestService.update(9L, new ReferralUpdateRequest(), WORKSPACE_ID))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void update_recordsHistory_onlyWhenStatusActuallyChanges() {
        ReferralRequest referral = ReferralRequest.builder()
                .user(currentUser).contact(contact()).targetRole("Backend Engineer")
                .status(ReferralStatus.PLANNED).build();
        referral.setId(9L);

        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(referralRepository.findByIdAndUserIdAndWorkspaceId(9L, 1L, WORKSPACE_ID)).thenReturn(Optional.of(referral));
        when(referralRepository.save(any(ReferralRequest.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(historyRepository.findAllByReferralIdAndUserId(eq(9L), eq(1L), any())).thenReturn(List.of());

        ReferralUpdateRequest sameStatusRequest = new ReferralUpdateRequest();
        sameStatusRequest.setStatus(ReferralStatus.PLANNED);
        referralRequestService.update(9L, sameStatusRequest, WORKSPACE_ID);
        verify(historyRepository, never()).save(any());

        ReferralUpdateRequest changedStatusRequest = new ReferralUpdateRequest();
        changedStatusRequest.setStatus(ReferralStatus.OUTREACH_SENT);
        referralRequestService.update(9L, changedStatusRequest, WORKSPACE_ID);
        verify(historyRepository, times(1)).save(any(ReferralStatusHistory.class));
    }

    @Test
    void update_linksOptionalApplication() {
        ReferralRequest referral = ReferralRequest.builder()
                .user(currentUser).contact(contact()).targetRole("Backend Engineer")
                .status(ReferralStatus.PLANNED).build();
        referral.setId(9L);

        com.careerflow.application.JobApplication application = new com.careerflow.application.JobApplication();
        application.setId(33L);

        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(referralRepository.findByIdAndUserIdAndWorkspaceId(9L, 1L, WORKSPACE_ID)).thenReturn(Optional.of(referral));
        when(applicationRepository.findByIdAndUserIdAndWorkspaceId(33L, 1L, WORKSPACE_ID)).thenReturn(Optional.of(application));
        when(referralRepository.save(any(ReferralRequest.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ReferralUpdateRequest request = new ReferralUpdateRequest();
        request.setApplicationId(33L);

        ReferralResponse response = referralRequestService.update(9L, request, WORKSPACE_ID);

        assertThat(response.getApplicationId()).isEqualTo(33L);
    }

    @ParameterizedTest(name = "{0} -> {1} should be rejected")
    @CsvSource({
            "REFERRAL_DECLINED, OUTREACH_SENT",
            "NO_RESPONSE, AWAITING_RESPONSE",
            "ROLE_CLOSED, REFERRAL_AGREED",
            "PLANNED, REFERRAL_SUBMITTED",
            "OUTREACH_SENT, REFERRAL_SUBMITTED",
            "AWAITING_RESPONSE, REFERRAL_SUBMITTED"
    })
    void update_rejectsInvalidStatusTransitions(ReferralStatus current, ReferralStatus next) {
        ReferralRequest referral = ReferralRequest.builder()
                .user(currentUser).contact(contact()).targetRole("Backend Engineer").status(current).build();
        referral.setId(9L);

        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(referralRepository.findByIdAndUserIdAndWorkspaceId(9L, 1L, WORKSPACE_ID)).thenReturn(Optional.of(referral));

        ReferralUpdateRequest request = new ReferralUpdateRequest();
        request.setStatus(next);

        assertThatThrownBy(() -> referralRequestService.update(9L, request, WORKSPACE_ID))
                .isInstanceOf(BadRequestException.class);
    }

    @ParameterizedTest(name = "{0} -> {1} should be allowed")
    @CsvSource({
            "PLANNED, OUTREACH_SENT",
            "OUTREACH_SENT, AWAITING_RESPONSE",
            "AWAITING_RESPONSE, REFERRAL_AGREED",
            "REFERRAL_AGREED, REFERRAL_SUBMITTED",
            "REFERRAL_DECLINED, PLANNED",
            "NO_RESPONSE, PLANNED",
            "ROLE_CLOSED, PLANNED"
    })
    void update_allowsValidStatusTransitions(ReferralStatus current, ReferralStatus next) {
        ReferralRequest referral = ReferralRequest.builder()
                .user(currentUser).contact(contact()).targetRole("Backend Engineer").status(current).build();
        referral.setId(9L);

        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(referralRepository.findByIdAndUserIdAndWorkspaceId(9L, 1L, WORKSPACE_ID)).thenReturn(Optional.of(referral));
        when(referralRepository.save(any(ReferralRequest.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(historyRepository.findAllByReferralIdAndUserId(eq(9L), eq(1L), any())).thenReturn(List.of());

        ReferralUpdateRequest request = new ReferralUpdateRequest();
        request.setStatus(next);

        assertThatCode(() -> referralRequestService.update(9L, request, WORKSPACE_ID)).doesNotThrowAnyException();
        assertThat(referral.getStatus()).isEqualTo(next);
    }

    @Test
    void manageNote_add_throwsBadRequestException_whenNoteBlank() {
        ReferralNoteActionRequest request = new ReferralNoteActionRequest();
        request.setAction("ADD");
        request.setNote("   ");

        when(securityUtils.getCurrentUser()).thenReturn(currentUser);

        assertThatThrownBy(() -> referralRequestService.manageNote(9L, request, WORKSPACE_ID))
                .isInstanceOf(BadRequestException.class);

        verify(historyRepository, never()).save(any());
    }

    @Test
    void manageNote_edit_throwsBadRequestException_whenEntryIsNotUserAddedNote() {
        ReferralStatusHistory entry = ReferralStatusHistory.builder()
                .fromStatus(ReferralStatus.PLANNED).toStatus(ReferralStatus.OUTREACH_SENT).noteOnly(false).build();
        entry.setId(3L);

        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(historyRepository.findByIdAndReferralIdAndUserId(3L, 9L, 1L)).thenReturn(Optional.of(entry));

        ReferralNoteActionRequest request = new ReferralNoteActionRequest();
        request.setAction("EDIT");
        request.setNoteId(3L);
        request.setNote("updated note");

        assertThatThrownBy(() -> referralRequestService.manageNote(9L, request, WORKSPACE_ID))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Only user-added notes can be edited");
    }

    @Test
    void manageNote_delete_throwsResourceNotFoundException_whenEntryMissing() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(historyRepository.findByIdAndReferralIdAndUserId(3L, 9L, 1L)).thenReturn(Optional.empty());

        ReferralNoteActionRequest request = new ReferralNoteActionRequest();
        request.setAction("DELETE");
        request.setNoteId(3L);

        assertThatThrownBy(() -> referralRequestService.manageNote(9L, request, WORKSPACE_ID))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void manageNote_throwsBadRequestException_forUnknownAction() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);

        ReferralNoteActionRequest request = new ReferralNoteActionRequest();
        request.setAction("BOGUS");

        assertThatThrownBy(() -> referralRequestService.manageNote(9L, request, WORKSPACE_ID))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Invalid action");
    }

    @Test
    void delete_softDeletes_whenOwned() {
        ReferralRequest referral = ReferralRequest.builder()
                .user(currentUser).contact(contact()).targetRole("Backend Engineer").build();
        referral.setId(9L);

        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(referralRepository.findByIdAndUserIdAndWorkspaceId(9L, 1L, WORKSPACE_ID)).thenReturn(Optional.of(referral));

        referralRequestService.delete(9L, WORKSPACE_ID);

        assertThat(referral.getDeletedAt()).isNotNull();
        verify(referralRepository).save(referral);
    }
}
