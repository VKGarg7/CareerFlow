package com.careerflow.auth;

import com.careerflow.audit.AuditAction;
import com.careerflow.audit.AuditLogService;
import com.careerflow.auth.dto.*;
import com.careerflow.config.JwtUtil;
import com.careerflow.exception.BadRequestException;
import com.careerflow.exception.ResourceNotFoundException;
import com.careerflow.user.User;
import com.careerflow.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Slf4j
@SuppressWarnings("null")
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final BlacklistedTokenRepository blacklistedTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final EmailService emailService;
    private final AuditLogService auditLogService;

    public RegisterResponse register(RegisterRequest request) {
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("Passwords do not match");
        }
        if (userRepository.existsByEmail(request.getEmail().toLowerCase())) {
            throw new BadRequestException("An account with this email already exists");
        }

        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail().toLowerCase())
                .password(passwordEncoder.encode(request.getPassword()))
                .build();

        User saved = userRepository.save(user);
        auditLogService.log(saved, AuditAction.USER_REGISTERED, "Account created for " + saved.getEmail());

        return RegisterResponse.builder()
                .id(saved.getId())
                .firstName(saved.getFirstName())
                .lastName(saved.getLastName())
                .email(saved.getEmail())
                .message("Account created successfully")
                .build();
    }

    public LoginResponse login(LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail().toLowerCase(),
                            request.getPassword()
                    )
            );
        } catch (DisabledException e) {
            throw new BadRequestException("This account has been deactivated");
        } catch (AuthenticationException e) {
            throw new BadRequestException("Invalid email or password");
        }

        User user = userRepository.findByEmail(request.getEmail().toLowerCase())
                .orElseThrow(() -> new BadRequestException("Invalid email or password"));

        String token = jwtUtil.generateToken(user.getEmail());
        auditLogService.log(user, AuditAction.USER_LOGIN, "Logged in");

        return LoginResponse.builder()
                .token(token)
                .role(user.getRole())
                .build();
    }

    public Map<String, String> logout(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new BadRequestException("No token provided");
        }

        String token = authHeader.substring(7);

        if (!jwtUtil.isTokenValid(token)) {
            throw new BadRequestException("Invalid token");
        }

        LocalDateTime expiresAt = jwtUtil.extractExpiration(token);

        blacklistedTokenRepository.save(
                BlacklistedToken.builder()
                        .token(token)
                        .expiresAt(expiresAt)
                        .build()
        );

        userRepository.findByEmail(jwtUtil.extractEmail(token))
                .ifPresent(user -> auditLogService.log(user, AuditAction.USER_LOGOUT, "Logged out"));

        return Map.of("message", "Logged out successfully");
    }

    public Map<String, String> forgotPassword(ForgotPasswordRequest request) {
        String email = request.getEmail().toLowerCase();

        userRepository.findByEmail(email).ifPresent(user -> {
            passwordResetTokenRepository.deleteByUser(user);

            String token = UUID.randomUUID().toString();

            passwordResetTokenRepository.save(
                    PasswordResetToken.builder()
                            .token(token)
                            .user(user)
                            .expiresAt(LocalDateTime.now().plusMinutes(15))
                            .build()
            );

            try {
                emailService.sendPasswordResetEmail(email, token);
            } catch (Exception e) {
                log.warn("Failed to send password reset email to {}: {}", email, e.getMessage());
            }
        });

        return Map.of("message", "If this email exists, a password reset link has been sent");
    }

    public Map<String, String> resetPassword(ResetPasswordRequest request) {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("Passwords do not match");
        }

        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(request.getToken())
                .orElseThrow(() -> new BadRequestException("Invalid or expired reset token"));

        if (resetToken.isExpired()) {
            passwordResetTokenRepository.delete(resetToken);
            throw new BadRequestException("Invalid or expired reset token");
        }

        User user = resetToken.getUser();

        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword()))
            throw new BadRequestException("New password must be different from the current password");

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        passwordResetTokenRepository.delete(resetToken);
        auditLogService.log(user, AuditAction.PASSWORD_RESET, "Password reset via email link");

        return Map.of("message", "Password reset successfully");
    }

    public Map<String, String> changePassword(ChangePasswordRequest request) {
        if (!request.getNewPassword().equals(request.getConfirmPassword()))
            throw new BadRequestException("Passwords do not match");

        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword()))
            throw new BadRequestException("Current password is incorrect");

        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword()))
            throw new BadRequestException("New password must be different from the current password");

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        auditLogService.log(user, AuditAction.PASSWORD_CHANGED, "Password changed");

        return Map.of("message", "Password changed successfully");
    }

    @Scheduled(cron = "0 0 * * * *")
    public void cleanupExpiredTokens() {
        blacklistedTokenRepository.deleteAllExpired(LocalDateTime.now());
        passwordResetTokenRepository.deleteAllExpired(LocalDateTime.now());
    }
}
