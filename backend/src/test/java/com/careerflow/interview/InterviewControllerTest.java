package com.careerflow.interview;

import com.careerflow.common.ControllerTestSupport;
import com.careerflow.config.JwtAuthFilter;
import com.careerflow.config.SecurityConfig;
import com.careerflow.exception.GlobalExceptionHandler;
import com.careerflow.exception.ResourceNotFoundException;
import com.careerflow.interview.dto.InterviewRequest;
import com.careerflow.interview.dto.InterviewResponse;
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

import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SuppressWarnings("null")
@WebMvcTest(controllers = InterviewController.class,
        excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE,
                classes = {SecurityConfig.class, JwtAuthFilter.class}))
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class InterviewControllerTest extends ControllerTestSupport {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private InterviewService interviewService;

    @Test
    void create_returns201_withCreatedInterview() throws Exception {
        InterviewRequest request = new InterviewRequest();
        request.setScheduledAt(LocalDateTime.now().plusDays(1));

        InterviewResponse response = InterviewResponse.builder().id(1L).applicationId(50L)
                .outcome(InterviewOutcome.AWAITING_RESPONSE).build();
        when(interviewService.create(eq(50L), any(InterviewRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/applications/{applicationId}/interviews", 50L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    void create_returns404_whenApplicationNotOwned() throws Exception {
        InterviewRequest request = new InterviewRequest();
        request.setScheduledAt(LocalDateTime.now().plusDays(1));

        when(interviewService.create(eq(50L), any(InterviewRequest.class)))
                .thenThrow(new ResourceNotFoundException("Application not found"));

        mockMvc.perform(post("/api/applications/{applicationId}/interviews", 50L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    @Test
    void getForApplication_returns200_withList() throws Exception {
        when(interviewService.getForApplication(50L)).thenReturn(java.util.List.of());

        mockMvc.perform(get("/api/applications/{applicationId}/interviews", 50L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void delete_returns204_whenSuccessful() throws Exception {
        doNothing().when(interviewService).delete(anyLong());

        mockMvc.perform(delete("/api/interviews/{id}", 9L))
                .andExpect(status().isNoContent());

        verify(interviewService).delete(9L);
    }

    @Test
    void delete_returns404_whenNotOwned() throws Exception {
        doThrow(new ResourceNotFoundException("Interview not found")).when(interviewService).delete(9L);

        mockMvc.perform(delete("/api/interviews/{id}", 9L))
                .andExpect(status().isNotFound());
    }
}
