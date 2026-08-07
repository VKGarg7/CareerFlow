package com.careerflow.goal;

import com.careerflow.common.ControllerTestSupport;
import com.careerflow.common.PageResponse;
import com.careerflow.config.JwtAuthFilter;
import com.careerflow.config.SecurityConfig;
import com.careerflow.exception.BadRequestException;
import com.careerflow.exception.GlobalExceptionHandler;
import com.careerflow.exception.ResourceNotFoundException;
import com.careerflow.goal.dto.GoalRequest;
import com.careerflow.goal.dto.GoalResponse;
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

import java.time.LocalDate;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SuppressWarnings("null")
@WebMvcTest(controllers = GoalController.class,
        excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE,
                classes = {SecurityConfig.class, JwtAuthFilter.class}))
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class GoalControllerTest extends ControllerTestSupport {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private GoalService goalService;

    private GoalRequest validRequest() {
        GoalRequest request = new GoalRequest();
        request.setMetricType(GoalMetricType.APPLICATIONS);
        request.setTargetValue(10);
        request.setStartDate(LocalDate.of(2026, 1, 1));
        request.setEndDate(LocalDate.of(2026, 1, 31));
        return request;
    }

    @Test
    void addGoal_returns201_withCreatedGoal() throws Exception {
        GoalResponse response = GoalResponse.builder()
                .id(1L).metricType(GoalMetricType.APPLICATIONS).targetValue(10)
                .status(GoalStatus.ACTIVE).progress(0).build();
        when(goalService.addGoal(any(GoalRequest.class), anyLong())).thenReturn(response);

        mockMvc.perform(post("/api/goals")
                        .param("workspaceId", "99")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.metricType").value("APPLICATIONS"));
    }

    @Test
    void addGoal_returns400_whenTargetValueMissing() throws Exception {
        GoalRequest request = validRequest();
        request.setTargetValue(null);

        mockMvc.perform(post("/api/goals")
                        .param("workspaceId", "99")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verify(goalService, never()).addGoal(any(), anyLong());
    }

    @Test
    void addGoal_returns400_whenEndDateBeforeStartDate() throws Exception {
        when(goalService.addGoal(any(GoalRequest.class), anyLong()))
                .thenThrow(new BadRequestException("End date must not be before start date"));

        mockMvc.perform(post("/api/goals")
                        .param("workspaceId", "99")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest())))
                .andExpect(status().isBadRequest());
    }

    @Test
    void getMyGoals_returns200_withPageResponse() throws Exception {
        PageResponse<GoalResponse> page = PageResponse.<GoalResponse>builder()
                .content(java.util.List.of())
                .page(0).size(10).totalElements(0).totalPages(0).last(true)
                .build();
        when(goalService.getMyGoals(any(), any(), any(), any(), anyInt(), anyInt(), anyLong())).thenReturn(page);

        mockMvc.perform(get("/api/goals").param("workspaceId", "99"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }

    @Test
    void updateGoal_returns404_whenNotFound() throws Exception {
        when(goalService.updateGoal(eq(99L), any(), anyLong()))
                .thenThrow(new ResourceNotFoundException("Goal not found"));

        mockMvc.perform(patch("/api/goals/{id}", 99L)
                        .param("workspaceId", "99")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Goal not found"));
    }

    @Test
    void deleteGoal_returns204_whenSuccessful() throws Exception {
        doNothing().when(goalService).deleteGoal(anyLong(), anyLong());

        mockMvc.perform(delete("/api/goals/{id}", 5L).param("workspaceId", "99"))
                .andExpect(status().isNoContent());

        verify(goalService).deleteGoal(5L, 99L);
    }
}
