package com.careerflow.contact;

import com.careerflow.common.ControllerTestSupport;
import com.careerflow.config.JwtAuthFilter;
import com.careerflow.config.SecurityConfig;
import com.careerflow.contact.dto.ContactRelationshipTypeCountsResponse;
import com.careerflow.contact.dto.ContactRequest;
import com.careerflow.contact.dto.ContactResponse;
import com.careerflow.exception.BadRequestException;
import com.careerflow.exception.DuplicateResourceException;
import com.careerflow.exception.GlobalExceptionHandler;
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

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SuppressWarnings("null")
@WebMvcTest(controllers = ContactController.class,
        excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE,
                classes = {SecurityConfig.class, JwtAuthFilter.class}))
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class ContactControllerTest extends ControllerTestSupport {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ContactService contactService;

    @Test
    void addContact_returns201_withCreatedContact() throws Exception {
        ContactRequest request = new ContactRequest();
        request.setName("Jane");

        ContactResponse response = ContactResponse.builder().id(1L).name("Jane").build();
        when(contactService.addContact(any(ContactRequest.class), anyLong())).thenReturn(response);

        mockMvc.perform(post("/api/contacts")
                        .param("workspaceId", "99")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    void addContact_returns400_whenNameIsBlank() throws Exception {
        ContactRequest request = new ContactRequest();
        request.setName("");

        mockMvc.perform(post("/api/contacts")
                        .param("workspaceId", "99")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void addContact_returns409_whenDuplicateEmail() throws Exception {
        ContactRequest request = new ContactRequest();
        request.setName("Jane");
        request.setEmail("jane@corp.com");

        when(contactService.addContact(any(ContactRequest.class), anyLong()))
                .thenThrow(new DuplicateResourceException("A contact with email 'jane@corp.com' already exists"));

        mockMvc.perform(post("/api/contacts")
                        .param("workspaceId", "99")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict());
    }

    @Test
    void getMyContacts_returns400_whenStatusInvalid() throws Exception {
        when(contactService.getMyContacts(any(), any(), org.mockito.ArgumentMatchers.eq("BOGUS"), any(), any(), any(),
                org.mockito.ArgumentMatchers.anyInt(), org.mockito.ArgumentMatchers.anyInt(), anyLong()))
                .thenThrow(new BadRequestException("Invalid status value: BOGUS"));

        mockMvc.perform(get("/api/contacts").param("status", "BOGUS").param("workspaceId", "99"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void getMyContacts_returns400_whenRelationshipTypeInvalid() throws Exception {
        when(contactService.getMyContacts(any(), any(), any(), org.mockito.ArgumentMatchers.eq("BOGUS"), any(), any(),
                org.mockito.ArgumentMatchers.anyInt(), org.mockito.ArgumentMatchers.anyInt(), anyLong()))
                .thenThrow(new BadRequestException("Invalid relationshipType value: BOGUS"));

        mockMvc.perform(get("/api/contacts").param("relationshipType", "BOGUS").param("workspaceId", "99"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void getMyRelationshipTypeStats_returns200() throws Exception {
        ContactRelationshipTypeCountsResponse response = ContactRelationshipTypeCountsResponse.builder()
                .total(0L).byRelationshipType(java.util.Map.of()).build();
        when(contactService.getMyRelationshipTypeStats(99L)).thenReturn(response);

        mockMvc.perform(get("/api/contacts/stats/relationship-type").param("workspaceId", "99"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(0));
    }

    @Test
    void getRelationshipTypes_returns200_withAllTypes() throws Exception {
        when(contactService.getRelationshipTypes()).thenReturn(List.of(ContactRelationshipType.values()));

        mockMvc.perform(get("/api/contacts/relationship-types"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(ContactRelationshipType.values().length));
    }

    @Test
    void deleteContact_returns204_whenSuccessful() throws Exception {
        doNothing().when(contactService).deleteContact(9L, 99L);

        mockMvc.perform(delete("/api/contacts/{id}", 9L).param("workspaceId", "99"))
                .andExpect(status().isNoContent());

        verify(contactService).deleteContact(9L, 99L);
    }
}
