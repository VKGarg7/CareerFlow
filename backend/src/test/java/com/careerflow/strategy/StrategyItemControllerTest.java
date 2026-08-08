package com.careerflow.strategy;

import com.careerflow.common.ControllerTestSupport;
import com.careerflow.config.JwtAuthFilter;
import com.careerflow.config.SecurityConfig;
import com.careerflow.exception.GlobalExceptionHandler;
import com.careerflow.exception.ResourceNotFoundException;
import com.careerflow.strategy.dto.StrategyItemReorderRequest;
import com.careerflow.strategy.dto.StrategyItemRequest;
import com.careerflow.strategy.dto.StrategyItemResponse;
import com.careerflow.strategy.dto.StrategyPlanResponse;
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

import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SuppressWarnings("null")
@WebMvcTest(controllers = StrategyItemController.class,
        excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE,
                classes = {SecurityConfig.class, JwtAuthFilter.class}))
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class StrategyItemControllerTest extends ControllerTestSupport {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private StrategyItemService strategyItemService;

    private StrategyItemRequest validRequest() {
        StrategyItemRequest request = new StrategyItemRequest();
        request.setOpportunityId(5L);
        request.setActionType(StrategyActionType.RESUME_TAILORING);
        request.setTitle("Tailor resume");
        return request;
    }

    @Test
    void addItem_returns201_withCreatedItem() throws Exception {
        StrategyItemResponse response = StrategyItemResponse.builder()
                .id(1L).opportunityId(5L).title("Tailor resume").status(StrategyItemStatus.PLANNED).build();
        when(strategyItemService.addItem(any(StrategyItemRequest.class), anyLong())).thenReturn(response);

        mockMvc.perform(post("/api/strategy-items")
                        .param("workspaceId", "99")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.status").value("PLANNED"));
    }

    @Test
    void addItem_returns400_whenTitleMissing() throws Exception {
        StrategyItemRequest request = validRequest();
        request.setTitle(null);

        mockMvc.perform(post("/api/strategy-items")
                        .param("workspaceId", "99")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verify(strategyItemService, never()).addItem(any(), anyLong());
    }

    @Test
    void getPlanForOpportunity_returns200_withReadiness() throws Exception {
        StrategyPlanResponse plan = StrategyPlanResponse.builder()
                .opportunityId(5L).items(List.of()).readiness(ReadinessState.READY_TO_APPLY)
                .totalCount(0).completedCount(0).skippedCount(0).build();
        when(strategyItemService.getPlanForOpportunity(eq(5L), anyLong())).thenReturn(plan);

        mockMvc.perform(get("/api/strategy-items").param("opportunityId", "5").param("workspaceId", "99"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.readiness").value("READY_TO_APPLY"));
    }

    @Test
    void updateItem_returns404_whenNotFound() throws Exception {
        when(strategyItemService.updateItem(eq(99L), any(), anyLong()))
                .thenThrow(new ResourceNotFoundException("Strategy item not found"));

        mockMvc.perform(patch("/api/strategy-items/{id}", 99L)
                        .param("workspaceId", "99")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Strategy item not found"));
    }

    @Test
    void reorderItems_returns200_withReorderedPlan() throws Exception {
        StrategyPlanResponse plan = StrategyPlanResponse.builder()
                .opportunityId(5L).items(List.of()).readiness(ReadinessState.NOT_STARTED)
                .totalCount(0).completedCount(0).skippedCount(0).build();
        when(strategyItemService.reorderItems(eq(5L), any(StrategyItemReorderRequest.class), anyLong())).thenReturn(plan);

        StrategyItemReorderRequest reorder = new StrategyItemReorderRequest();
        reorder.setOrderedItemIds(List.of(1L, 2L));

        mockMvc.perform(put("/api/strategy-items/reorder")
                        .param("opportunityId", "5")
                        .param("workspaceId", "99")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reorder)))
                .andExpect(status().isOk());
    }

    @Test
    void deleteItem_returns204_whenSuccessful() throws Exception {
        doNothing().when(strategyItemService).deleteItem(anyLong(), anyLong());

        mockMvc.perform(delete("/api/strategy-items/{id}", 5L).param("workspaceId", "99"))
                .andExpect(status().isNoContent());

        verify(strategyItemService).deleteItem(5L, 99L);
    }
}
