package com.careerflow.company;

import com.careerflow.common.ControllerTestSupport;
import com.careerflow.common.PageResponse;
import com.careerflow.company.dto.CompanyRequest;
import com.careerflow.company.dto.CompanyResponse;
import com.careerflow.config.JwtAuthFilter;
import com.careerflow.config.SecurityConfig;
import com.careerflow.exception.ConflictException;
import com.careerflow.exception.DuplicateResourceException;
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
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SuppressWarnings("null")
@WebMvcTest(controllers = CompanyController.class,
        excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE,
                classes = {SecurityConfig.class, JwtAuthFilter.class}))
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class CompanyControllerTest extends ControllerTestSupport {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private CompanyService companyService;

    @Test
    void addCompany_returns201_withCreatedCompany() throws Exception {
        CompanyRequest request = new CompanyRequest();
        request.setName("Acme");

        CompanyResponse response = CompanyResponse.builder().id(1L).name("Acme").status(CompanyStatus.TARGETING).build();
        when(companyService.addCompany(any(CompanyRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/companies")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Acme"));
    }

    @Test
    void addCompany_returns400_whenNameIsBlank() throws Exception {
        CompanyRequest request = new CompanyRequest();
        request.setName("   ");

        mockMvc.perform(post("/api/companies")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verify(companyService, never()).addCompany(any());
    }

    @Test
    void addCompany_returns409_whenDuplicateResourceException() throws Exception {
        CompanyRequest request = new CompanyRequest();
        request.setName("Acme");

        when(companyService.addCompany(any(CompanyRequest.class)))
                .thenThrow(new DuplicateResourceException("Company 'Acme' already exists"));

        mockMvc.perform(post("/api/companies")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Company 'Acme' already exists"));
    }

    @Test
    void getMyCompanies_returns200_withPageResponse() throws Exception {
        PageResponse<CompanyResponse> page = PageResponse.<CompanyResponse>builder()
                .content(java.util.List.of())
                .page(0).size(10).totalElements(0).totalPages(0).last(true)
                .build();
        when(companyService.getMyCompanies(any(), any(), any(), any(), any(), anyInt(), anyInt())).thenReturn(page);

        mockMvc.perform(get("/api/companies"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }

    @Test
    void updateCompany_returns404_whenNotFound() throws Exception {
        when(companyService.updateCompany(eq(99L), any()))
                .thenThrow(new ResourceNotFoundException("Company not found"));

        mockMvc.perform(patch("/api/companies/{id}", 99L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Company not found"));
    }

    @Test
    void deleteCompany_returns409_whenConflictAndForceNotSet() throws Exception {
        doThrow(new ConflictException("Company has existing applications"))
                .when(companyService).deleteCompany(eq(5L), eq(false));

        mockMvc.perform(delete("/api/companies/{id}", 5L))
                .andExpect(status().isConflict());
    }

    @Test
    void deleteCompany_returns204_whenSuccessful() throws Exception {
        doNothing().when(companyService).deleteCompany(anyLong(), anyBoolean());

        mockMvc.perform(delete("/api/companies/{id}", 5L).param("force", "true"))
                .andExpect(status().isNoContent());

        verify(companyService).deleteCompany(5L, true);
    }
}
