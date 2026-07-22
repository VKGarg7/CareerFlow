package com.careerflow.auth;

import com.careerflow.auth.dto.LoginRequest;
import com.careerflow.auth.dto.LoginResponse;
import com.careerflow.auth.dto.RegisterRequest;
import com.careerflow.auth.dto.RegisterResponse;
import com.careerflow.common.ControllerTestSupport;
import com.careerflow.config.JwtAuthFilter;
import com.careerflow.config.SecurityConfig;
import com.careerflow.exception.BadRequestException;
import com.careerflow.exception.GlobalExceptionHandler;
import com.careerflow.user.Role;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SuppressWarnings("null")
@WebMvcTest(controllers = AuthController.class,
        excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE,
                classes = {SecurityConfig.class, JwtAuthFilter.class}))
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class AuthControllerTest extends ControllerTestSupport {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthService authService;

    @Test
    void register_returns201_withCreatedAccount() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setFirstName("Jane");
        request.setEmail("jane@example.com");
        request.setPassword("password1");
        request.setConfirmPassword("password1");

        RegisterResponse response = RegisterResponse.builder().id(1L).email("jane@example.com")
                .message("Account created successfully").build();
        when(authService.register(any(RegisterRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value("jane@example.com"));
    }

    @Test
    void register_returns400_whenPasswordsDoNotMatch() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setFirstName("Jane");
        request.setEmail("jane@example.com");
        request.setPassword("password1");
        request.setConfirmPassword("password2");

        when(authService.register(any(RegisterRequest.class)))
                .thenThrow(new BadRequestException("Passwords do not match"));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void register_returns400_whenEmailBlank() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setFirstName("Jane");
        request.setPassword("password1");
        request.setConfirmPassword("password1");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verify(authService, never()).register(any());
    }

    @Test
    void login_returns200_withToken() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setEmail("jane@example.com");
        request.setPassword("secret123");

        LoginResponse response = LoginResponse.builder().token("jwt-token").role(Role.USER).build();
        when(authService.login(any(LoginRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("jwt-token"));
    }

    @Test
    void login_returns400_whenCredentialsInvalid() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setEmail("jane@example.com");
        request.setPassword("wrong");

        when(authService.login(any(LoginRequest.class)))
                .thenThrow(new BadRequestException("Invalid email or password"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void logout_returns200() throws Exception {
        when(authService.logout("Bearer abc")).thenReturn(java.util.Map.of("message", "Logged out successfully"));

        mockMvc.perform(post("/api/auth/logout").header("Authorization", "Bearer abc"))
                .andExpect(status().isOk());
    }
}
