package com.careerflow.common;

import com.careerflow.exception.ResourceNotFoundException;
import com.careerflow.user.User;
import com.careerflow.user.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SecurityUtilsTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private SecurityUtils securityUtils;

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void getCurrentUserEmail_returnsAuthenticationName() {
        setAuthenticatedUser("jane@example.com");

        assertThat(securityUtils.getCurrentUserEmail()).isEqualTo("jane@example.com");
    }

    @Test
    void getCurrentUser_returnsUser_whenFound() {
        setAuthenticatedUser("jane@example.com");
        User user = new User();
        user.setId(1L);
        when(userRepository.findByEmail("jane@example.com")).thenReturn(Optional.of(user));

        assertThat(securityUtils.getCurrentUser()).isEqualTo(user);
    }

    @Test
    void getCurrentUser_throwsResourceNotFoundException_whenUserMissing() {
        setAuthenticatedUser("ghost@example.com");
        when(userRepository.findByEmail("ghost@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> securityUtils.getCurrentUser())
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("User not found");
    }

    private void setAuthenticatedUser(String email) {
        Authentication authentication = mock(Authentication.class);
        when(authentication.getName()).thenReturn(email);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
    }
}
