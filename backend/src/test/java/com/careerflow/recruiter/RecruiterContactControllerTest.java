package com.careerflow.recruiter;

import com.careerflow.common.ControllerTestSupport;
import com.careerflow.config.JwtAuthFilter;
import com.careerflow.config.SecurityConfig;
import com.careerflow.exception.BadRequestException;
import com.careerflow.exception.DuplicateResourceException;
import com.careerflow.exception.GlobalExceptionHandler;
import com.careerflow.recruiter.dto.RecruiterContactRequest;
import com.careerflow.recruiter.dto.RecruiterContactResponse;
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
@WebMvcTest(controllers = RecruiterContactController.class,
        excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE,
                classes = {SecurityConfig.class, JwtAuthFilter.class}))
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class RecruiterContactControllerTest extends ControllerTestSupport {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private RecruiterContactService recruiterContactService;

    @Test
    void addRecruiter_returns201_withCreatedRecruiter() throws Exception {
        RecruiterContactRequest request = new RecruiterContactRequest();
        request.setName("Jane");

        RecruiterContactResponse response = RecruiterContactResponse.builder().id(1L).name("Jane").build();
        when(recruiterContactService.addRecruiter(any(RecruiterContactRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/recruiters")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    void addRecruiter_returns400_whenNameIsBlank() throws Exception {
        RecruiterContactRequest request = new RecruiterContactRequest();
        request.setName("");

        mockMvc.perform(post("/api/recruiters")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void addRecruiter_returns409_whenDuplicateEmail() throws Exception {
        RecruiterContactRequest request = new RecruiterContactRequest();
        request.setName("Jane");
        request.setEmail("jane@corp.com");

        when(recruiterContactService.addRecruiter(any(RecruiterContactRequest.class)))
                .thenThrow(new DuplicateResourceException("A recruiter with email 'jane@corp.com' already exists"));

        mockMvc.perform(post("/api/recruiters")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict());
    }

    @Test
    void getMyRecruiters_returns400_whenStatusInvalid() throws Exception {
        when(recruiterContactService.getMyRecruiters(any(), any(), org.mockito.ArgumentMatchers.eq("BOGUS"), any(), any(), org.mockito.ArgumentMatchers.anyInt(), org.mockito.ArgumentMatchers.anyInt()))
                .thenThrow(new BadRequestException("Invalid status value: BOGUS"));

        mockMvc.perform(get("/api/recruiters").param("status", "BOGUS"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void deleteRecruiter_returns204_whenSuccessful() throws Exception {
        doNothing().when(recruiterContactService).deleteRecruiter(9L);

        mockMvc.perform(delete("/api/recruiters/{id}", 9L))
                .andExpect(status().isNoContent());

        verify(recruiterContactService).deleteRecruiter(9L);
    }
}
