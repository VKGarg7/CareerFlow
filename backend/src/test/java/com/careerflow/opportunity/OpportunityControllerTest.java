package com.careerflow.opportunity;

import com.careerflow.common.ControllerTestSupport;
import com.careerflow.common.PageResponse;
import com.careerflow.config.JwtAuthFilter;
import com.careerflow.config.SecurityConfig;
import com.careerflow.exception.GlobalExceptionHandler;
import com.careerflow.exception.ResourceNotFoundException;
import com.careerflow.opportunity.dto.DuplicateCheckRequest;
import com.careerflow.opportunity.dto.DuplicateMatch;
import com.careerflow.opportunity.dto.OpportunityRequest;
import com.careerflow.opportunity.dto.OpportunityResponse;
import com.careerflow.resume.LinkAction;
import com.careerflow.resume.dto.ResumeLinkHistoryResponse;
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
@WebMvcTest(controllers = OpportunityController.class,
        excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE,
                classes = {SecurityConfig.class, JwtAuthFilter.class}))
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class OpportunityControllerTest extends ControllerTestSupport {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private OpportunityService opportunityService;

    private OpportunityRequest validRequest() {
        OpportunityRequest request = new OpportunityRequest();
        request.setCompanyId(5L);
        request.setRoleTitle("Backend Engineer");
        return request;
    }

    @Test
    void addOpportunity_returns201_withCreatedOpportunity() throws Exception {
        OpportunityResponse response = OpportunityResponse.builder()
                .id(1L).companyId(5L).roleTitle("Backend Engineer").status(OpportunityStatus.SAVED).build();
        when(opportunityService.addOpportunity(any(OpportunityRequest.class), anyLong())).thenReturn(response);

        mockMvc.perform(post("/api/opportunities")
                        .param("workspaceId", "99")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.status").value("SAVED"));
    }

    @Test
    void addOpportunity_returns400_whenRoleTitleMissing() throws Exception {
        OpportunityRequest request = validRequest();
        request.setRoleTitle(null);

        mockMvc.perform(post("/api/opportunities")
                        .param("workspaceId", "99")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verify(opportunityService, never()).addOpportunity(any(), anyLong());
    }

    @Test
    void getMyOpportunities_returns200_withPageResponse() throws Exception {
        PageResponse<OpportunityResponse> page = PageResponse.<OpportunityResponse>builder()
                .content(java.util.List.of())
                .page(0).size(10).totalElements(0).totalPages(0).last(true)
                .build();
        when(opportunityService.getMyOpportunities(any(), any(), any(), any(), any(), anyInt(), anyInt(), anyLong()))
                .thenReturn(page);

        mockMvc.perform(get("/api/opportunities").param("workspaceId", "99"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }

    @Test
    void updateOpportunity_returns404_whenNotFound() throws Exception {
        when(opportunityService.updateOpportunity(eq(99L), any(), anyLong()))
                .thenThrow(new ResourceNotFoundException("Opportunity not found"));

        mockMvc.perform(patch("/api/opportunities/{id}", 99L)
                        .param("workspaceId", "99")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Opportunity not found"));
    }

    @Test
    void deleteOpportunity_returns204_whenSuccessful() throws Exception {
        doNothing().when(opportunityService).deleteOpportunity(anyLong(), anyLong());

        mockMvc.perform(delete("/api/opportunities/{id}", 5L).param("workspaceId", "99"))
                .andExpect(status().isNoContent());

        verify(opportunityService).deleteOpportunity(5L, 99L);
    }

    @Test
    void checkDuplicates_returns200_withMatchList() throws Exception {
        DuplicateMatch match = DuplicateMatch.builder()
                .opportunityId(3L).roleTitle("Backend Engineer").companyName("Acme Corp").matchReason("SAME_ROLE").build();
        when(opportunityService.checkDuplicates(any(DuplicateCheckRequest.class), anyLong()))
                .thenReturn(java.util.List.of(match));

        DuplicateCheckRequest request = new DuplicateCheckRequest();
        request.setCompanyId(5L);
        request.setRoleTitle("Backend Engineer");

        mockMvc.perform(post("/api/opportunities/check-duplicates")
                        .param("workspaceId", "99")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].opportunityId").value(3))
                .andExpect(jsonPath("$[0].matchReason").value("SAME_ROLE"));
    }

    @Test
    void checkDuplicates_returns400_whenCompanyIdMissing() throws Exception {
        DuplicateCheckRequest request = new DuplicateCheckRequest();
        request.setRoleTitle("Backend Engineer");

        mockMvc.perform(post("/api/opportunities/check-duplicates")
                        .param("workspaceId", "99")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verify(opportunityService, never()).checkDuplicates(any(), anyLong());
    }

    @Test
    void getResumeHistory_returns200_withHistoryList() throws Exception {
        ResumeLinkHistoryResponse entry = ResumeLinkHistoryResponse.builder()
                .id(1L).action(LinkAction.LINKED).newResumeTitle("SDE Resume").build();
        when(opportunityService.getResumeHistory(5L, 99L)).thenReturn(java.util.List.of(entry));

        mockMvc.perform(get("/api/opportunities/{id}/resume-history", 5L).param("workspaceId", "99"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].newResumeTitle").value("SDE Resume"));
    }

    @Test
    void convertToApplication_returns201_withApplicationResponse() throws Exception {
        com.careerflow.application.dto.ApplicationResponse appResponse =
                com.careerflow.application.dto.ApplicationResponse.builder().id(20L).build();
        when(opportunityService.convertToApplication(eq(1L), any(), anyLong())).thenReturn(appResponse);

        mockMvc.perform(post("/api/opportunities/{id}/convert", 1L)
                        .param("workspaceId", "99")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(20));
    }
}
