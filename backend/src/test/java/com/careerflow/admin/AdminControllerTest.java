package com.careerflow.admin;

import com.careerflow.admin.dto.AdminUserResponse;
import com.careerflow.admin.dto.SystemHealthResponse;
import com.careerflow.admin.dto.UserRoleUpdateRequest;
import com.careerflow.admin.dto.UserStatusUpdateRequest;
import com.careerflow.audit.AuditLogService;
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

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SuppressWarnings("null")
@WebMvcTest(controllers = AdminController.class,
        excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE,
                classes = {SecurityConfig.class, JwtAuthFilter.class}))
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class AdminControllerTest extends ControllerTestSupport {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AdminService adminService;
    @MockBean
    private AuditLogService auditLogService;
    @MockBean
    private SystemHealthService systemHealthService;

    @Test
    void updateUserStatus_returns200_withUpdatedUser() throws Exception {
        UserStatusUpdateRequest request = new UserStatusUpdateRequest();
        request.setActive(false);

        AdminUserResponse response = AdminUserResponse.builder().id(2L).active(false).build();
        when(adminService.setUserActive(2L, false)).thenReturn(response);

        mockMvc.perform(patch("/api/admin/users/{id}/status", 2L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active").value(false));
    }

    @Test
    void updateUserStatus_returns400_whenAdminDeactivatesSelf() throws Exception {
        UserStatusUpdateRequest request = new UserStatusUpdateRequest();
        request.setActive(false);

        when(adminService.setUserActive(1L, false))
                .thenThrow(new BadRequestException("You cannot deactivate your own account"));

        mockMvc.perform(patch("/api/admin/users/{id}/status", 1L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void updateUserRole_returns200() throws Exception {
        UserRoleUpdateRequest request = new UserRoleUpdateRequest();
        request.setRole(Role.ADMIN);

        AdminUserResponse response = AdminUserResponse.builder().id(2L).role(Role.ADMIN).build();
        when(adminService.setUserRole(2L, Role.ADMIN)).thenReturn(response);

        mockMvc.perform(patch("/api/admin/users/{id}/role", 2L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("ADMIN"));
    }

    @Test
    void getSystemHealth_returns200() throws Exception {
        when(systemHealthService.getHealth()).thenReturn(
                SystemHealthResponse.builder().databaseUp(true).availableProcessors(4).build());

        mockMvc.perform(get("/api/admin/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.databaseUp").value(true));
    }
}
