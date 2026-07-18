package com.careerflow.application;

import com.careerflow.application.dto.ApplicationRequest;
import com.careerflow.application.dto.ApplicationResponse;
import com.careerflow.common.ControllerTestSupport;
import com.careerflow.common.PageResponse;
import com.careerflow.config.JwtAuthFilter;
import com.careerflow.config.SecurityConfig;
import com.careerflow.exception.BadRequestException;
import com.careerflow.exception.GlobalExceptionHandler;
import com.careerflow.exception.ResourceNotFoundException;
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
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SuppressWarnings("null")
@WebMvcTest(controllers = ApplicationController.class,
        excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE,
                classes = {SecurityConfig.class, JwtAuthFilter.class}))
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class ApplicationControllerTest extends ControllerTestSupport {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ApplicationService applicationService;

    @Test
    void addApplication_returns201_withCreatedApplication() throws Exception {
        ApplicationRequest request = new ApplicationRequest();
        request.setCompanyId(100L);
        request.setRole("Backend Engineer");

        ApplicationResponse response = ApplicationResponse.builder().id(1L).companyId(100L).role("Backend Engineer")
                .status(ApplicationStatus.APPLIED).build();
        when(applicationService.addApplication(any(ApplicationRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/applications")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    void addApplication_returns404_whenCompanyNotOwned() throws Exception {
        ApplicationRequest request = new ApplicationRequest();
        request.setCompanyId(999L);
        request.setRole("Backend Engineer");

        when(applicationService.addApplication(any(ApplicationRequest.class)))
                .thenThrow(new ResourceNotFoundException("Company not found"));

        mockMvc.perform(post("/api/applications")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    @Test
    void addApplication_returns400_whenRoleMissing() throws Exception {
        ApplicationRequest request = new ApplicationRequest();
        request.setCompanyId(100L);

        mockMvc.perform(post("/api/applications")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void getMyApplications_returns200_withPageResponse() throws Exception {
        PageResponse<ApplicationResponse> page = PageResponse.<ApplicationResponse>builder()
                .content(java.util.List.of()).page(0).size(10).totalElements(0).totalPages(0).last(true).build();
        when(applicationService.getMyApplications(any(), any(), any(), any(), anyInt(), anyInt())).thenReturn(page);

        mockMvc.perform(get("/api/applications"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }

    @Test
    void delete_returns204_whenDocumentIdNotProvided() throws Exception {
        doNothing().when(applicationService).deleteApplication(50L);

        mockMvc.perform(delete("/api/applications/{id}", 50L))
                .andExpect(status().isNoContent());

        verify(applicationService).deleteApplication(50L);
        verify(applicationService, never()).deleteDocument(anyLong(), anyLong());
    }

    @Test
    void delete_deletesDocument_whenDocumentIdProvided() throws Exception {
        ApplicationResponse response = ApplicationResponse.builder().id(50L).build();
        when(applicationService.deleteDocument(50L, 9L)).thenReturn(response);

        mockMvc.perform(delete("/api/applications/{id}", 50L).param("documentId", "9"))
                .andExpect(status().isOk());

        verify(applicationService).deleteDocument(50L, 9L);
        verify(applicationService, never()).deleteApplication(anyLong());
    }

    @Test
    void updateApplication_returns400_whenExpectedSalaryUpdateFails() throws Exception {
        when(applicationService.updateApplication(eq(50L), any()))
                .thenThrow(new BadRequestException("Only PDF, DOC, and DOCX files are supported"));

        mockMvc.perform(patch("/api/applications/{id}", 50L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }
}
