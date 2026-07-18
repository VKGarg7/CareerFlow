package com.careerflow.audit;

import com.careerflow.common.PageResponse;
import com.careerflow.exception.BadRequestException;
import com.careerflow.user.User;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.*;

@SuppressWarnings("null")
@ExtendWith(MockitoExtension.class)
class AuditLogServiceTest {

    @Mock
    private AuditLogRepository auditLogRepository;

    @InjectMocks
    private AuditLogService auditLogService;

    @Test
    void log_setsActorEmailFromActor_whenActorProvided() {
        User user = new User();
        user.setId(1L);
        user.setEmail("actor@example.com");

        auditLogService.log(user, AuditAction.USER_LOGIN, "Logged in");

        ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogRepository).save(captor.capture());
        assertThat(captor.getValue().getActorEmail()).isEqualTo("actor@example.com");
        assertThat(captor.getValue().getAction()).isEqualTo(AuditAction.USER_LOGIN);
    }

    @Test
    void log_leavesActorEmailNull_whenActorIsNull() {
        auditLogService.log(null, AuditAction.USER_LOGIN, "System event");

        ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogRepository).save(captor.capture());
        assertThat(captor.getValue().getActorEmail()).isNull();
        assertThat(captor.getValue().getUser()).isNull();
    }

    @Test
    void getMyActivity_throwsBadRequestException_whenActionInvalid() {
        assertThatThrownBy(() -> auditLogService.getMyActivity(1L, "NOT_AN_ACTION", 0, 10))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("NOT_AN_ACTION");
    }

    @Test
    void getMyActivity_treatsBlankAction_asNoFilter() {
        Page<AuditLog> emptyPage = new PageImpl<>(java.util.List.of());
        when(auditLogRepository.search(eq(1L), isNull(), any(Pageable.class))).thenReturn(emptyPage);

        PageResponse<?> response = auditLogService.getMyActivity(1L, "  ", 0, 10);

        assertThat(response.getContent()).isEmpty();
        verify(auditLogRepository).search(eq(1L), isNull(), any(Pageable.class));
    }

    @Test
    void getPlatformActivity_searchesWithNullUserId() {
        Page<AuditLog> emptyPage = new PageImpl<>(java.util.List.of());
        when(auditLogRepository.search(isNull(), eq(AuditAction.USER_LOGIN), any(Pageable.class))).thenReturn(emptyPage);

        auditLogService.getPlatformActivity("user_login", 0, 10);

        verify(auditLogRepository).search(isNull(), eq(AuditAction.USER_LOGIN), any(Pageable.class));
    }
}
