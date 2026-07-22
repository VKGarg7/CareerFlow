package com.careerflow.config.oauth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.AuthenticationException;
import org.springframework.test.util.ReflectionTestUtils;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.startsWith;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;

@SuppressWarnings("null")
@ExtendWith(MockitoExtension.class)
class OAuth2AuthenticationFailureHandlerTest {

    @InjectMocks
    private OAuth2AuthenticationFailureHandler handler;

    @Mock
    private HttpServletRequest request;
    @Mock
    private HttpServletResponse response;
    @Mock
    private AuthenticationException exception;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(handler, "frontendUrl", "https://careerflow.example.com");
        lenient().when(response.encodeRedirectURL(any())).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void onAuthenticationFailure_redirectsToLogin_withEncodedErrorMessage() throws Exception {
        handler.onAuthenticationFailure(request, response, exception);

        verify(response).sendRedirect(startsWith("https://careerflow.example.com/login"));
        verify(response).sendRedirect(contains("error="));
    }
}
