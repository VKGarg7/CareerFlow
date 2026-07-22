package com.careerflow.referral;

import com.careerflow.common.ControllerTestSupport;
import com.careerflow.config.JwtAuthFilter;
import com.careerflow.config.SecurityConfig;
import com.careerflow.exception.BadRequestException;
import com.careerflow.exception.GlobalExceptionHandler;
import com.careerflow.exception.ResourceNotFoundException;
import com.careerflow.referral.dto.ReferralNoteActionRequest;
import com.careerflow.referral.dto.ReferralRequestDto;
import com.careerflow.referral.dto.ReferralResponse;
import com.careerflow.referral.dto.ReferralUpdateRequest;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SuppressWarnings("null")
@WebMvcTest(controllers = ReferralRequestController.class,
        excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE,
                classes = {SecurityConfig.class, JwtAuthFilter.class}))
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class ReferralRequestControllerTest extends ControllerTestSupport {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ReferralRequestService referralRequestService;

    @Test
    void create_returns201_withCreatedReferral() throws Exception {
        ReferralRequestDto request = new ReferralRequestDto();
        request.setReferrerName("Alex");
        request.setReferrerCompany("Acme");
        request.setTargetRole("Backend Engineer");

        ReferralResponse response = ReferralResponse.builder().id(1L).status(ReferralStatus.DRAFT).build();
        when(referralRequestService.create(any(ReferralRequestDto.class))).thenReturn(response);

        mockMvc.perform(post("/api/referrals")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    void create_returns400_whenRequiredFieldMissing() throws Exception {
        ReferralRequestDto request = new ReferralRequestDto();

        mockMvc.perform(post("/api/referrals")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void update_returns400_whenStatusTransitionInvalid() throws Exception {
        ReferralUpdateRequest request = new ReferralUpdateRequest();
        request.setStatus(ReferralStatus.OFFER_RECEIVED);

        when(referralRequestService.update(eq(9L), any(ReferralUpdateRequest.class)))
                .thenThrow(new BadRequestException("Status can only be set to OFFER_RECEIVED after INTERVIEWING."));

        mockMvc.perform(patch("/api/referrals/{id}", 9L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void getById_returns404_whenNotOwned() throws Exception {
        when(referralRequestService.getById(9L)).thenThrow(new ResourceNotFoundException("Referral request not found"));

        mockMvc.perform(get("/api/referrals/{id}", 9L))
                .andExpect(status().isNotFound());
    }

    @Test
    void manageNote_returns400_forUnknownAction() throws Exception {
        ReferralNoteActionRequest request = new ReferralNoteActionRequest();
        request.setAction("BOGUS");

        when(referralRequestService.manageNote(eq(9L), any(ReferralNoteActionRequest.class)))
                .thenThrow(new BadRequestException("Invalid action: BOGUS. Must be ADD, EDIT, or DELETE"));

        mockMvc.perform(patch("/api/referrals/{id}/notes", 9L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void delete_returns204_whenSuccessful() throws Exception {
        doNothing().when(referralRequestService).delete(9L);

        mockMvc.perform(delete("/api/referrals/{id}", 9L))
                .andExpect(status().isNoContent());

        verify(referralRequestService).delete(9L);
    }
}
