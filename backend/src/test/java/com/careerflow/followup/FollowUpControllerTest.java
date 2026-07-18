package com.careerflow.followup;

import com.careerflow.common.ControllerTestSupport;
import com.careerflow.config.JwtAuthFilter;
import com.careerflow.config.SecurityConfig;
import com.careerflow.exception.GlobalExceptionHandler;
import com.careerflow.exception.ResourceNotFoundException;
import com.careerflow.followup.dto.FollowUpRequest;
import com.careerflow.followup.dto.FollowUpResponse;
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

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SuppressWarnings("null")
@WebMvcTest(controllers = FollowUpController.class,
        excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE,
                classes = {SecurityConfig.class, JwtAuthFilter.class}))
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class FollowUpControllerTest extends ControllerTestSupport {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private FollowUpService followUpService;

    @Test
    void create_returns201_withCreatedFollowUp() throws Exception {
        FollowUpRequest request = new FollowUpRequest();
        request.setFollowUpDate(LocalDate.now().plusDays(3));

        FollowUpResponse response = FollowUpResponse.builder().id(1L).applicationId(50L).build();
        when(followUpService.createFollowUp(eq(50L), any(FollowUpRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/applications/{applicationId}/follow-ups", 50L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    void create_returns404_whenApplicationNotOwned() throws Exception {
        FollowUpRequest request = new FollowUpRequest();
        request.setFollowUpDate(LocalDate.now().plusDays(3));

        when(followUpService.createFollowUp(eq(50L), any(FollowUpRequest.class)))
                .thenThrow(new ResourceNotFoundException("Application not found"));

        mockMvc.perform(post("/api/applications/{applicationId}/follow-ups", 50L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    @Test
    void getCounts_returns200() throws Exception {
        when(followUpService.getFollowUpCounts()).thenReturn(
                com.careerflow.followup.dto.FollowUpCountsResponse.builder()
                        .overdue(1).dueToday(2).upcoming(3).completed(4).build());

        mockMvc.perform(get("/api/follow-ups/counts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.overdue").value(1));
    }

    @Test
    void delete_returns204_whenSuccessful() throws Exception {
        doNothing().when(followUpService).deleteFollowUp(anyLong());

        mockMvc.perform(delete("/api/follow-ups/{id}", 9L))
                .andExpect(status().isNoContent());

        verify(followUpService).deleteFollowUp(9L);
    }

    @Test
    void delete_returns404_whenNotOwned() throws Exception {
        doThrow(new ResourceNotFoundException("Follow-up not found")).when(followUpService).deleteFollowUp(9L);

        mockMvc.perform(delete("/api/follow-ups/{id}", 9L))
                .andExpect(status().isNotFound());
    }
}
