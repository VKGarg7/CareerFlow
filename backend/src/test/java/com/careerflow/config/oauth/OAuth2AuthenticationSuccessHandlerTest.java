package com.careerflow.config.oauth;

import com.careerflow.config.JwtUtil;
import com.careerflow.user.Role;
import com.careerflow.user.User;
import com.careerflow.user.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.startsWith;
import static org.mockito.Mockito.*;

@SuppressWarnings("null")
@ExtendWith(MockitoExtension.class)
class OAuth2AuthenticationSuccessHandlerTest {

    @Mock
    private JwtUtil jwtUtil;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private OAuth2AuthenticationSuccessHandler handler;

    @Mock
    private HttpServletRequest request;
    @Mock
    private HttpServletResponse response;
    @Mock
    private Authentication authentication;
    @Mock
    private OAuth2User oAuth2User;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(handler, "frontendUrl", "https://careerflow.example.com");
        when(authentication.getPrincipal()).thenReturn(oAuth2User);
        lenient().when(response.encodeRedirectURL(any())).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void onAuthenticationSuccess_redirectsWithTokenAndRole_whenUserExists() throws Exception {
        when(oAuth2User.<String>getAttribute("email")).thenReturn("jane@example.com");
        User user = new User();
        user.setRole(Role.ADMIN);
        when(userRepository.findByEmail("jane@example.com")).thenReturn(Optional.of(user));
        when(jwtUtil.generateToken("jane@example.com")).thenReturn("jwt-token");

        handler.onAuthenticationSuccess(request, response, authentication);

        verify(response).sendRedirect(contains("token=jwt-token"));
        verify(response).sendRedirect(contains("role=ADMIN"));
        verify(response).sendRedirect(startsWith("https://careerflow.example.com/oauth-callback"));
    }

    @Test
    void onAuthenticationSuccess_defaultsRoleToUser_whenUserNotFound() throws Exception {
        when(oAuth2User.<String>getAttribute("email")).thenReturn("newuser@example.com");
        when(userRepository.findByEmail("newuser@example.com")).thenReturn(Optional.empty());
        when(jwtUtil.generateToken("newuser@example.com")).thenReturn("jwt-token");

        handler.onAuthenticationSuccess(request, response, authentication);

        ArgumentCaptor<String> urlCaptor = ArgumentCaptor.forClass(String.class);
        verify(response).sendRedirect(urlCaptor.capture());
        assertThat(urlCaptor.getValue()).contains("role=USER");
    }

    @Test
    void onAuthenticationSuccess_throwsServletException_whenEmailAttributeMissing() {
        when(oAuth2User.<String>getAttribute("email")).thenReturn(null);

        assertThatThrownBy(() -> handler.onAuthenticationSuccess(request, response, authentication))
                .isInstanceOf(ServletException.class)
                .hasMessageContaining("no email attribute");
    }
}
