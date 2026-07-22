package com.careerflow.referral;

import com.careerflow.audit.AuditLogService;
import com.careerflow.common.SecurityUtils;
import com.careerflow.exception.BadRequestException;
import com.careerflow.exception.DuplicateResourceException;
import com.careerflow.exception.ResourceNotFoundException;
import com.careerflow.referral.dto.ReferralNoteActionRequest;
import com.careerflow.referral.dto.ReferralRequestDto;
import com.careerflow.referral.dto.ReferralResponse;
import com.careerflow.referral.dto.ReferralUpdateRequest;
import com.careerflow.user.User;
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
    private SecurityUtils securityUtils;
    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private ReferralRequestService referralRequestService;

    private User currentUser;

    @BeforeEach
    void setUp() {
        currentUser = new User();
        currentUser.setId(1L);
    }

    private ReferralRequestDto validCreateDto() {
        ReferralRequestDto dto = new ReferralRequestDto();
        dto.setReferrerName("Alex");
        dto.setReferrerCompany("Acme");
        dto.setTargetRole("Backend Engineer");
        dto.setReferrerEmail("alex@acme.com");
        return dto;
    }

    @Test
    void create_throwsDuplicateResourceException_whenSameEmailAndRoleAlreadyExists() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(referralRepository.existsByUserIdAndReferrerEmailIgnoreCaseAndTargetRoleIgnoreCase(
                1L, "alex@acme.com", "Backend Engineer")).thenReturn(true);

        assertThatThrownBy(() -> referralRequestService.create(validCreateDto()))
                .isInstanceOf(DuplicateResourceException.class);

        verify(referralRepository, never()).save(any());
    }

    @Test
    void create_savesWithDraftStatus_whenStatusNotProvided() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(referralRepository.existsByUserIdAndReferrerEmailIgnoreCaseAndTargetRoleIgnoreCase(any(), any(), any()))
                .thenReturn(false);
        when(referralRepository.save(any(ReferralRequest.class))).thenAnswer(invocation -> {
            ReferralRequest referral = invocation.getArgument(0);
            referral.setId(11L);
            return referral;
        });

        ReferralResponse response = referralRequestService.create(validCreateDto());

        assertThat(response.getId()).isEqualTo(11L);
        assertThat(response.getStatus()).isEqualTo(ReferralStatus.DRAFT);
        verify(historyRepository).save(any(ReferralStatusHistory.class));
    }

    @Test
    void getMyReferrals_throwsBadRequestException_whenStatusInvalid() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);

        assertThatThrownBy(() -> referralRequestService.getMyReferrals(null, "NOT_A_STATUS", "targetRole", "asc", 0, 10))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("NOT_A_STATUS");
    }

    @Test
    void update_throwsResourceNotFoundException_whenNotOwned() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(referralRepository.findByIdAndUserId(9L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> referralRequestService.update(9L, new ReferralUpdateRequest()))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void update_recordsHistory_onlyWhenStatusActuallyChanges() {
        ReferralRequest referral = ReferralRequest.builder()
                .user(currentUser).referrerName("Alex").referrerCompany("Acme")
                .targetRole("Backend Engineer").status(ReferralStatus.DRAFT).build();
        referral.setId(9L);

        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(referralRepository.findByIdAndUserId(9L, 1L)).thenReturn(Optional.of(referral));
        when(referralRepository.save(any(ReferralRequest.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(historyRepository.findAllByReferralIdAndUserId(eq(9L), eq(1L), any())).thenReturn(List.of());

        ReferralUpdateRequest sameStatusRequest = new ReferralUpdateRequest();
        sameStatusRequest.setStatus(ReferralStatus.DRAFT);
        referralRequestService.update(9L, sameStatusRequest);
        verify(historyRepository, never()).save(any());

        ReferralUpdateRequest changedStatusRequest = new ReferralUpdateRequest();
        changedStatusRequest.setStatus(ReferralStatus.REQUESTED);
        referralRequestService.update(9L, changedStatusRequest);
        verify(historyRepository, times(1)).save(any(ReferralStatusHistory.class));
    }

    @ParameterizedTest(name = "{0} -> {1} should be rejected")
    @CsvSource({
            "REJECTED, REQUESTED",
            "WITHDRAWN, ACKNOWLEDGED",
            "DECLINED, REFERRED",
            "DRAFT, REFERRED",
            "ACKNOWLEDGED, INTERVIEWING",
            "DRAFT, INTERVIEWING",
            "REQUESTED, OFFER_RECEIVED",
            "REFERRED, OFFER_RECEIVED"
    })
    void update_rejectsInvalidStatusTransitions(ReferralStatus current, ReferralStatus next) {
        ReferralRequest referral = ReferralRequest.builder()
                .user(currentUser).referrerName("Alex").referrerCompany("Acme")
                .targetRole("Backend Engineer").status(current).build();
        referral.setId(9L);

        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(referralRepository.findByIdAndUserId(9L, 1L)).thenReturn(Optional.of(referral));

        ReferralUpdateRequest request = new ReferralUpdateRequest();
        request.setStatus(next);

        assertThatThrownBy(() -> referralRequestService.update(9L, request))
                .isInstanceOf(BadRequestException.class);
    }

    @ParameterizedTest(name = "{0} -> {1} should be allowed")
    @CsvSource({
            "REQUESTED, REFERRED",
            "ACKNOWLEDGED, REFERRED",
            "REFERRED, INTERVIEWING",
            "INTERVIEWING, OFFER_RECEIVED",
            "REJECTED, DRAFT",
            "WITHDRAWN, DRAFT",
            "DECLINED, DRAFT"
    })
    void update_allowsValidStatusTransitions(ReferralStatus current, ReferralStatus next) {
        ReferralRequest referral = ReferralRequest.builder()
                .user(currentUser).referrerName("Alex").referrerCompany("Acme")
                .targetRole("Backend Engineer").status(current).build();
        referral.setId(9L);

        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(referralRepository.findByIdAndUserId(9L, 1L)).thenReturn(Optional.of(referral));
        when(referralRepository.save(any(ReferralRequest.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(historyRepository.findAllByReferralIdAndUserId(eq(9L), eq(1L), any())).thenReturn(List.of());

        ReferralUpdateRequest request = new ReferralUpdateRequest();
        request.setStatus(next);

        assertThatCode(() -> referralRequestService.update(9L, request)).doesNotThrowAnyException();
        assertThat(referral.getStatus()).isEqualTo(next);
    }

    @Test
    void manageNote_add_throwsBadRequestException_whenNoteBlank() {
        ReferralNoteActionRequest request = new ReferralNoteActionRequest();
        request.setAction("ADD");
        request.setNote("   ");

        when(securityUtils.getCurrentUser()).thenReturn(currentUser);

        assertThatThrownBy(() -> referralRequestService.manageNote(9L, request))
                .isInstanceOf(BadRequestException.class);

        verify(historyRepository, never()).save(any());
    }

    @Test
    void manageNote_edit_throwsBadRequestException_whenEntryIsNotUserAddedNote() {
        ReferralStatusHistory entry = ReferralStatusHistory.builder()
                .fromStatus(ReferralStatus.DRAFT).toStatus(ReferralStatus.REQUESTED).noteOnly(false).build();
        entry.setId(3L);

        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(historyRepository.findByIdAndReferralIdAndUserId(3L, 9L, 1L)).thenReturn(Optional.of(entry));

        ReferralNoteActionRequest request = new ReferralNoteActionRequest();
        request.setAction("EDIT");
        request.setNoteId(3L);
        request.setNote("updated note");

        assertThatThrownBy(() -> referralRequestService.manageNote(9L, request))
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

        assertThatThrownBy(() -> referralRequestService.manageNote(9L, request))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void manageNote_throwsBadRequestException_forUnknownAction() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);

        ReferralNoteActionRequest request = new ReferralNoteActionRequest();
        request.setAction("BOGUS");

        assertThatThrownBy(() -> referralRequestService.manageNote(9L, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Invalid action");
    }

    @Test
    void delete_softDeletes_whenOwned() {
        ReferralRequest referral = ReferralRequest.builder()
                .user(currentUser).referrerName("Alex").referrerCompany("Acme")
                .targetRole("Backend Engineer").build();
        referral.setId(9L);

        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(referralRepository.findByIdAndUserId(9L, 1L)).thenReturn(Optional.of(referral));

        referralRequestService.delete(9L);

        assertThat(referral.getDeletedAt()).isNotNull();
        verify(referralRepository).save(referral);
    }
}
