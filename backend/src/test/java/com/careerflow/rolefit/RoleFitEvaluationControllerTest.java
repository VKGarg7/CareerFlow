package com.careerflow.rolefit;

import com.careerflow.common.ControllerTestSupport;
import com.careerflow.config.JwtAuthFilter;
import com.careerflow.config.SecurityConfig;
import com.careerflow.exception.GlobalExceptionHandler;
import com.careerflow.exception.ResourceNotFoundException;
import com.careerflow.rolefit.dto.RoleFitEvaluationRequest;
import com.careerflow.rolefit.dto.RoleFitEvaluationResponse;
import com.careerflow.rolefit.dto.RoleFitOverrideRequest;
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

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SuppressWarnings("null")
@WebMvcTest(controllers = RoleFitEvaluationController.class,
        excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE,
                classes = {SecurityConfig.class, JwtAuthFilter.class}))
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class RoleFitEvaluationControllerTest extends ControllerTestSupport {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private RoleFitEvaluationService roleFitEvaluationService;

    private RoleFitEvaluationRequest validRequest() {
        RoleFitEvaluationRequest request = new RoleFitEvaluationRequest();
        request.setOpportunityId(5L);
        request.setRequiredSkills("Java, Spring Boot");
        return request;
    }

    @Test
    void addEvaluation_returns201_withCreatedEvaluation() throws Exception {
        RoleFitEvaluationResponse response = RoleFitEvaluationResponse.builder()
                .id(1L).opportunityId(5L).computedFitScore(50).effectiveFitScore(50).build();
        when(roleFitEvaluationService.addEvaluation(any(RoleFitEvaluationRequest.class), anyLong())).thenReturn(response);

        mockMvc.perform(post("/api/role-fit-evaluations")
                        .param("workspaceId", "99")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.effectiveFitScore").value(50));
    }

    @Test
    void addEvaluation_returns400_whenOpportunityIdMissing() throws Exception {
        RoleFitEvaluationRequest request = validRequest();
        request.setOpportunityId(null);

        mockMvc.perform(post("/api/role-fit-evaluations")
                        .param("workspaceId", "99")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verify(roleFitEvaluationService, never()).addEvaluation(any(), anyLong());
    }

    @Test
    void getEvaluationForOpportunity_returns404_whenNotFound() throws Exception {
        when(roleFitEvaluationService.getEvaluationForOpportunity(eq(5L), anyLong()))
                .thenThrow(new ResourceNotFoundException("Fit evaluation not found"));

        mockMvc.perform(get("/api/role-fit-evaluations").param("opportunityId", "5").param("workspaceId", "99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Fit evaluation not found"));
    }

    @Test
    void overrideEvaluation_returns200_withUpdatedResponse() throws Exception {
        RoleFitEvaluationResponse response = RoleFitEvaluationResponse.builder()
                .id(1L).effectiveFitScore(90).effectiveFitTier(FitTier.STRONG_FIT).build();
        when(roleFitEvaluationService.overrideEvaluation(eq(1L), any(RoleFitOverrideRequest.class), anyLong()))
                .thenReturn(response);

        RoleFitOverrideRequest override = new RoleFitOverrideRequest();
        override.setOverrideFitScore(90);

        mockMvc.perform(patch("/api/role-fit-evaluations/{id}/override", 1L)
                        .param("workspaceId", "99")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(override)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.effectiveFitScore").value(90));
    }

    @Test
    void overrideEvaluation_returns400_whenScoreOutOfRange() throws Exception {
        RoleFitOverrideRequest override = new RoleFitOverrideRequest();
        override.setOverrideFitScore(150);

        mockMvc.perform(patch("/api/role-fit-evaluations/{id}/override", 1L)
                        .param("workspaceId", "99")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(override)))
                .andExpect(status().isBadRequest());

        verify(roleFitEvaluationService, never()).overrideEvaluation(anyLong(), any(), anyLong());
    }

    @Test
    void deleteEvaluation_returns204_whenSuccessful() throws Exception {
        doNothing().when(roleFitEvaluationService).deleteEvaluation(anyLong(), anyLong());

        mockMvc.perform(delete("/api/role-fit-evaluations/{id}", 5L).param("workspaceId", "99"))
                .andExpect(status().isNoContent());

        verify(roleFitEvaluationService).deleteEvaluation(5L, 99L);
    }
}
