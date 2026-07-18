package com.careerflow.user;

import com.careerflow.common.ControllerTestSupport;
import com.careerflow.config.JwtAuthFilter;
import com.careerflow.config.SecurityConfig;
import com.careerflow.exception.BadRequestException;
import com.careerflow.exception.GlobalExceptionHandler;
import com.careerflow.user.dto.ProfileUpdateResponse;
import com.careerflow.user.dto.UpdateProfileRequest;
import com.careerflow.user.dto.UserProfileResponse;
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

import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SuppressWarnings("null")
@WebMvcTest(controllers = UserController.class,
        excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE,
                classes = {SecurityConfig.class, JwtAuthFilter.class}))
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class UserControllerTest extends ControllerTestSupport {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserService userService;

    @Test
    void getMyProfile_returns200() throws Exception {
        UserProfileResponse response = UserProfileResponse.builder().id(1L).firstName("Jane").build();
        when(userService.getMyProfile()).thenReturn(response);

        mockMvc.perform(get("/api/users/profile"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstName").value("Jane"));
    }

    @Test
    void saveProfile_returns200_withChanges() throws Exception {
        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setFirstName("Janet");

        ProfileUpdateResponse response = new ProfileUpdateResponse(Map.of());
        when(userService.saveProfile(any(UpdateProfileRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/users/profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    void saveProfile_returns400_whenEmailAlreadyInUse() throws Exception {
        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setEmail("taken@example.com");

        when(userService.saveProfile(any(UpdateProfileRequest.class)))
                .thenThrow(new BadRequestException("Email is already in use"));

        mockMvc.perform(post("/api/users/profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void deleteProfile_returns204() throws Exception {
        doNothing().when(userService).deleteProfile();

        mockMvc.perform(delete("/api/users/profile"))
                .andExpect(status().isNoContent());

        verify(userService).deleteProfile();
    }
}
