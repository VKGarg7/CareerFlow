package com.careerflow.resume;

import com.careerflow.common.ControllerTestSupport;
import com.careerflow.common.PageResponse;
import com.careerflow.config.JwtAuthFilter;
import com.careerflow.config.SecurityConfig;
import com.careerflow.exception.ConflictException;
import com.careerflow.exception.GlobalExceptionHandler;
import com.careerflow.exception.ResourceNotFoundException;
import com.careerflow.resume.dto.ResumeResponse;
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
@WebMvcTest(controllers = ResumeController.class,
        excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE,
                classes = {SecurityConfig.class, JwtAuthFilter.class}))
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class ResumeControllerTest extends ControllerTestSupport {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ResumeService resumeService;

    @Test
    void getMyResumes_returns200_withPageResponse() throws Exception {
        PageResponse<ResumeResponse> page = PageResponse.<ResumeResponse>builder()
                .content(java.util.List.of())
                .page(0).size(10).totalElements(0).totalPages(0).last(true)
                .build();
        when(resumeService.getMyResumes(any(), any(), any(), any(), any(), anyInt(), anyInt(), anyLong())).thenReturn(page);

        mockMvc.perform(get("/api/resumes").param("workspaceId", "99"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }

    @Test
    void updateResume_returns404_whenNotFound() throws Exception {
        when(resumeService.updateResume(eq(99L), any(), anyLong()))
                .thenThrow(new ResourceNotFoundException("Resume not found"));

        mockMvc.perform(patch("/api/resumes/{id}", 99L)
                        .param("workspaceId", "99")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Resume not found"));
    }

    @Test
    void updateResume_returns200_withUpdatedResume() throws Exception {
        ResumeResponse response = ResumeResponse.builder().id(1L).title("SDE Resume").status(ResumeStatus.INACTIVE).build();
        when(resumeService.updateResume(eq(1L), any(), anyLong())).thenReturn(response);

        mockMvc.perform(patch("/api/resumes/{id}", 1L)
                        .param("workspaceId", "99")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"INACTIVE\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("INACTIVE"));
    }

    @Test
    void deleteResume_returns409_whenConflictAndForceNotSet() throws Exception {
        doThrow(new ConflictException("Resume has been used in past applications"))
                .when(resumeService).deleteResume(eq(5L), eq(false), anyLong());

        mockMvc.perform(delete("/api/resumes/{id}", 5L).param("workspaceId", "99"))
                .andExpect(status().isConflict());
    }

    @Test
    void deleteResume_returns204_whenSuccessful() throws Exception {
        doNothing().when(resumeService).deleteResume(anyLong(), anyBoolean(), anyLong());

        mockMvc.perform(delete("/api/resumes/{id}", 5L).param("force", "true").param("workspaceId", "99"))
                .andExpect(status().isNoContent());

        verify(resumeService).deleteResume(5L, true, 99L);
    }
}
