package com.careerflow.auth;

import com.careerflow.audit.AuditLogService;
import com.careerflow.auth.dto.ChangePasswordRequest;
import com.careerflow.auth.dto.ForgotPasswordRequest;
import com.careerflow.auth.dto.LoginRequest;
import com.careerflow.auth.dto.RegisterRequest;
import com.careerflow.auth.dto.ResetPasswordRequest;
import com.careerflow.config.JwtUtil;
import com.careerflow.exception.BadRequestException;
import com.careerflow.exception.ResourceNotFoundException;
import com.careerflow.user.User;
import com.careerflow.user.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@SuppressWarnings("null")
@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtUtil jwtUtil;
    @Mock
    private AuthenticationManager authenticationManager;
    @Mock
    private BlacklistedTokenRepository blacklistedTokenRepository;
    @Mock
    private PasswordResetTokenRepository passwordResetTokenRepository;
    @Mock
    private EmailService emailService;
    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private AuthService authService;

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void register_throwsBadRequestException_whenPasswordsDoNotMatch() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("jane@example.com");
        request.setPassword("password1");
        request.setConfirmPassword("password2");

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Passwords do not match");

        verify(userRepository, never()).save(any());
    }

    @Test
    void register_throwsBadRequestException_whenEmailAlreadyExists() {
        when(userRepository.existsByEmail("jane@example.com")).thenReturn(true);

        RegisterRequest request = new RegisterRequest();
        request.setEmail("Jane@Example.com");
        request.setPassword("password1");
        request.setConfirmPassword("password1");

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("already exists");
    }

    @Test
    void login_throwsBadRequestException_whenAccountDeactivated() {
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new DisabledException("disabled"));

        LoginRequest request = new LoginRequest();
        request.setEmail("jane@example.com");
        request.setPassword("secret123");

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("deactivated");
    }

    @Test
    void login_throwsBadRequestException_whenCredentialsInvalid() {
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new AuthenticationException("bad credentials") {});

        LoginRequest request = new LoginRequest();
        request.setEmail("jane@example.com");
        request.setPassword("wrong");

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Invalid email or password");
    }

    @Test
    void logout_throwsBadRequestException_whenNoBearerHeader() {
        assertThatThrownBy(() -> authService.logout("not-a-bearer-token"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("No token provided");
    }

    @Test
    void logout_throwsBadRequestException_whenTokenInvalid() {
        when(jwtUtil.isTokenValid("abc")).thenReturn(false);

        assertThatThrownBy(() -> authService.logout("Bearer abc"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Invalid token");
    }

    @Test
    void logout_blacklistsToken_whenValid() {
        when(jwtUtil.isTokenValid("abc")).thenReturn(true);
        when(jwtUtil.extractExpiration("abc")).thenReturn(LocalDateTime.now().plusHours(1));
        when(jwtUtil.extractEmail("abc")).thenReturn("jane@example.com");
        when(userRepository.findByEmail("jane@example.com")).thenReturn(Optional.empty());

        authService.logout("Bearer abc");

        verify(blacklistedTokenRepository).save(any(BlacklistedToken.class));
    }

    @Test
    void forgotPassword_neverThrows_whenEmailSendingFails() {
        User user = User.builder().id(1L).email("jane@example.com").build();
        when(userRepository.findByEmail("jane@example.com")).thenReturn(Optional.of(user));
        doThrow(new RuntimeException("smtp down")).when(emailService).sendPasswordResetEmail(any(), any());

        ForgotPasswordRequest request = new ForgotPasswordRequest();
        request.setEmail("jane@example.com");

        assertThat(authService.forgotPassword(request)).containsKey("message");
        verify(passwordResetTokenRepository).save(any(PasswordResetToken.class));
    }

    @Test
    void forgotPassword_returnsGenericMessage_whenUserDoesNotExist() {
        when(userRepository.findByEmail("nobody@example.com")).thenReturn(Optional.empty());

        ForgotPasswordRequest request = new ForgotPasswordRequest();
        request.setEmail("nobody@example.com");

        assertThat(authService.forgotPassword(request).get("message"))
                .isEqualTo("If this email exists, a password reset link has been sent");
        verify(passwordResetTokenRepository, never()).save(any());
    }

    @Test
    void resetPassword_throwsBadRequestException_whenPasswordsDoNotMatch() {
        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setToken("token");
        request.setNewPassword("newpass1");
        request.setConfirmPassword("newpass2");

        assertThatThrownBy(() -> authService.resetPassword(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Passwords do not match");
    }

    @Test
    void resetPassword_throwsBadRequestException_whenTokenExpired() {
        User user = User.builder().id(1L).email("jane@example.com").password("oldHash").build();
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .token("token").user(user).expiresAt(LocalDateTime.now().minusMinutes(1)).build();

        when(passwordResetTokenRepository.findByToken("token")).thenReturn(Optional.of(resetToken));

        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setToken("token");
        request.setNewPassword("newpass1");
        request.setConfirmPassword("newpass1");

        assertThatThrownBy(() -> authService.resetPassword(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Invalid or expired reset token");

        verify(passwordResetTokenRepository).delete(resetToken);
    }

    @Test
    void resetPassword_throwsBadRequestException_whenNewPasswordSameAsOld() {
        User user = User.builder().id(1L).email("jane@example.com").password("oldHash").build();
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .token("token").user(user).expiresAt(LocalDateTime.now().plusMinutes(10)).build();

        when(passwordResetTokenRepository.findByToken("token")).thenReturn(Optional.of(resetToken));
        when(passwordEncoder.matches("newpass1", "oldHash")).thenReturn(true);

        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setToken("token");
        request.setNewPassword("newpass1");
        request.setConfirmPassword("newpass1");

        assertThatThrownBy(() -> authService.resetPassword(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("must be different");
    }

    @Test
    void changePassword_throwsResourceNotFoundException_whenUserMissing() {
        setAuthenticatedUser("jane@example.com");
        when(userRepository.findByEmail("jane@example.com")).thenReturn(Optional.empty());

        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCurrentPassword("old");
        request.setNewPassword("newpass1");
        request.setConfirmPassword("newpass1");

        assertThatThrownBy(() -> authService.changePassword(request))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void changePassword_throwsBadRequestException_whenCurrentPasswordIncorrect() {
        User user = User.builder().id(1L).email("jane@example.com").password("oldHash").build();
        setAuthenticatedUser("jane@example.com");
        when(userRepository.findByEmail("jane@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrongCurrent", "oldHash")).thenReturn(false);

        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCurrentPassword("wrongCurrent");
        request.setNewPassword("newpass1");
        request.setConfirmPassword("newpass1");

        assertThatThrownBy(() -> authService.changePassword(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Current password is incorrect");
    }

    @Test
    void changePassword_succeeds_whenCurrentPasswordCorrectAndNewPasswordDifferent() {
        User user = User.builder().id(1L).email("jane@example.com").password("oldHash").build();
        setAuthenticatedUser("jane@example.com");
        when(userRepository.findByEmail("jane@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("oldPlain", "oldHash")).thenReturn(true);
        when(passwordEncoder.matches("newpass1", "oldHash")).thenReturn(false);
        when(passwordEncoder.encode("newpass1")).thenReturn("newHash");

        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCurrentPassword("oldPlain");
        request.setNewPassword("newpass1");
        request.setConfirmPassword("newpass1");

        authService.changePassword(request);

        assertThat(user.getPassword()).isEqualTo("newHash");
        verify(userRepository).save(user);
    }

    private void setAuthenticatedUser(String email) {
        Authentication authentication = mock(Authentication.class);
        when(authentication.getName()).thenReturn(email);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
    }
}
