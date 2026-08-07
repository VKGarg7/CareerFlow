package com.careerflow.researchnote;

import com.careerflow.common.ControllerTestSupport;
import com.careerflow.common.PageResponse;
import com.careerflow.config.JwtAuthFilter;
import com.careerflow.config.SecurityConfig;
import com.careerflow.exception.GlobalExceptionHandler;
import com.careerflow.exception.ResourceNotFoundException;
import com.careerflow.researchnote.dto.ResearchNoteRequest;
import com.careerflow.researchnote.dto.ResearchNoteResponse;
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
@WebMvcTest(controllers = ResearchNoteController.class,
        excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE,
                classes = {SecurityConfig.class, JwtAuthFilter.class}))
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class ResearchNoteControllerTest extends ControllerTestSupport {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ResearchNoteService researchNoteService;

    private ResearchNoteRequest validRequest() {
        ResearchNoteRequest request = new ResearchNoteRequest();
        request.setCompanyId(5L);
        request.setSection(ResearchNoteSection.TECH_STACK);
        request.setTitle("Backend stack");
        request.setContent("Java, Spring Boot, Postgres.");
        return request;
    }

    @Test
    void addNote_returns201_withCreatedNote() throws Exception {
        ResearchNoteResponse response = ResearchNoteResponse.builder()
                .id(1L).companyId(5L).companyName("Acme")
                .section(ResearchNoteSection.TECH_STACK).content("Java, Spring Boot, Postgres.").build();
        when(researchNoteService.addNote(any(ResearchNoteRequest.class), anyLong())).thenReturn(response);

        mockMvc.perform(post("/api/research-notes")
                        .param("workspaceId", "99")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.companyName").value("Acme"));
    }

    @Test
    void addNote_returns400_whenContentIsBlank() throws Exception {
        ResearchNoteRequest request = validRequest();
        request.setContent("   ");

        mockMvc.perform(post("/api/research-notes")
                        .param("workspaceId", "99")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verify(researchNoteService, never()).addNote(any(), anyLong());
    }

    @Test
    void searchNotes_returns200_withPageResponse() throws Exception {
        PageResponse<ResearchNoteResponse> page = PageResponse.<ResearchNoteResponse>builder()
                .content(java.util.List.of())
                .page(0).size(10).totalElements(0).totalPages(0).last(true)
                .build();
        when(researchNoteService.searchNotes(any(), any(), any(), anyInt(), anyInt(), anyLong())).thenReturn(page);

        mockMvc.perform(get("/api/research-notes").param("workspaceId", "99").param("search", "stack"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }

    @Test
    void getNotesForCompany_returns200_withNoteList() throws Exception {
        ResearchNoteResponse response = ResearchNoteResponse.builder().id(1L).companyId(5L).companyName("Acme").build();
        when(researchNoteService.getNotesForCompany(5L, 99L)).thenReturn(java.util.List.of(response));

        mockMvc.perform(get("/api/research-notes/by-company/{companyId}", 5L).param("workspaceId", "99"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1));
    }

    @Test
    void updateNote_returns404_whenNotFound() throws Exception {
        when(researchNoteService.updateNote(eq(99L), any(), anyLong()))
                .thenThrow(new ResourceNotFoundException("Research note not found"));

        mockMvc.perform(patch("/api/research-notes/{id}", 99L)
                        .param("workspaceId", "99")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Research note not found"));
    }

    @Test
    void deleteNote_returns204_whenSuccessful() throws Exception {
        doNothing().when(researchNoteService).deleteNote(anyLong(), anyLong());

        mockMvc.perform(delete("/api/research-notes/{id}", 5L).param("workspaceId", "99"))
                .andExpect(status().isNoContent());

        verify(researchNoteService).deleteNote(5L, 99L);
    }
}
