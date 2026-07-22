package com.careerflow.audit;

import com.careerflow.audit.dto.AuditLogResponse;
import com.careerflow.common.ControllerTestSupport;
import com.careerflow.common.PageResponse;
import com.careerflow.common.SecurityUtils;
import com.careerflow.config.JwtAuthFilter;
import com.careerflow.config.SecurityConfig;
import com.careerflow.exception.BadRequestException;
import com.careerflow.exception.GlobalExceptionHandler;
import com.careerflow.user.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = AuditLogController.class,
        excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE,
                classes = {SecurityConfig.class, JwtAuthFilter.class}))
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class AuditLogControllerTest extends ControllerTestSupport {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AuditLogService auditLogService;
    @MockBean
    private SecurityUtils securityUtils;

    @Test
    void getMyActivity_returns200_withPageResponse() throws Exception {
        User user = new User();
        user.setId(1L);
        when(securityUtils.getCurrentUser()).thenReturn(user);

        PageResponse<AuditLogResponse> page = PageResponse.<AuditLogResponse>builder()
                .content(java.util.List.of()).page(0).size(10).totalElements(0).totalPages(0).last(true).build();
        when(auditLogService.getMyActivity(eq(1L), any(), anyInt(), anyInt())).thenReturn(page);

        mockMvc.perform(get("/api/audit-logs/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }

    @Test
    void getMyActivity_returns400_whenActionInvalid() throws Exception {
        User user = new User();
        user.setId(1L);
        when(securityUtils.getCurrentUser()).thenReturn(user);
        when(auditLogService.getMyActivity(eq(1L), org.mockito.ArgumentMatchers.eq("BOGUS"), anyInt(), anyInt()))
                .thenThrow(new BadRequestException("Invalid action value: BOGUS"));

        mockMvc.perform(get("/api/audit-logs/me").param("action", "BOGUS"))
                .andExpect(status().isBadRequest());
    }

    private static long eq(long value) {
        return org.mockito.ArgumentMatchers.eq(value);
    }
}
