package com.careerflow.coverletter;

import com.careerflow.common.ControllerTestSupport;
import com.careerflow.common.PageResponse;
import com.careerflow.config.JwtAuthFilter;
import com.careerflow.config.SecurityConfig;
import com.careerflow.coverletter.dto.CoverLetterResponse;
import com.careerflow.exception.ConflictException;
import com.careerflow.exception.GlobalExceptionHandler;
import com.careerflow.exception.ResourceNotFoundException;
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
@WebMvcTest(controllers = CoverLetterController.class,
        excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE,
                classes = {SecurityConfig.class, JwtAuthFilter.class}))
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class CoverLetterControllerTest extends ControllerTestSupport {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CoverLetterService coverLetterService;

    @Test
    void getMyCoverLetters_returns200_withPageResponse() throws Exception {
        PageResponse<CoverLetterResponse> page = PageResponse.<CoverLetterResponse>builder()
                .content(java.util.List.of())
                .page(0).size(10).totalElements(0).totalPages(0).last(true)
                .build();
        when(coverLetterService.getMyCoverLetters(any(), any(), any(), any(), any(), anyInt(), anyInt(), anyLong())).thenReturn(page);

        mockMvc.perform(get("/api/cover-letters").param("workspaceId", "99"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }

    @Test
    void updateCoverLetter_returns404_whenNotFound() throws Exception {
        when(coverLetterService.updateCoverLetter(eq(99L), any(), anyLong()))
                .thenThrow(new ResourceNotFoundException("Cover letter not found"));

        mockMvc.perform(patch("/api/cover-letters/{id}", 99L)
                        .param("workspaceId", "99")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Cover letter not found"));
    }

    @Test
    void updateCoverLetter_returns200_withUpdatedCoverLetter() throws Exception {
        CoverLetterResponse response = CoverLetterResponse.builder().id(1L).title("Backend Cover Letter").status(CoverLetterStatus.INACTIVE).build();
        when(coverLetterService.updateCoverLetter(eq(1L), any(), anyLong())).thenReturn(response);

        mockMvc.perform(patch("/api/cover-letters/{id}", 1L)
                        .param("workspaceId", "99")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"INACTIVE\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("INACTIVE"));
    }

    @Test
    void deleteCoverLetter_returns409_whenConflictAndForceNotSet() throws Exception {
        doThrow(new ConflictException("Cover letter has been used in past applications"))
                .when(coverLetterService).deleteCoverLetter(eq(5L), eq(false), anyLong());

        mockMvc.perform(delete("/api/cover-letters/{id}", 5L).param("workspaceId", "99"))
                .andExpect(status().isConflict());
    }

    @Test
    void deleteCoverLetter_returns204_whenSuccessful() throws Exception {
        doNothing().when(coverLetterService).deleteCoverLetter(anyLong(), anyBoolean(), anyLong());

        mockMvc.perform(delete("/api/cover-letters/{id}", 5L).param("force", "true").param("workspaceId", "99"))
                .andExpect(status().isNoContent());

        verify(coverLetterService).deleteCoverLetter(5L, true, 99L);
    }
}
