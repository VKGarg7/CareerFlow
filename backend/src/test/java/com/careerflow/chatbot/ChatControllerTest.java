package com.careerflow.chatbot;

import com.careerflow.chatbot.dto.*;
import com.careerflow.common.ControllerTestSupport;
import com.careerflow.config.JwtAuthFilter;
import com.careerflow.config.SecurityConfig;
import com.careerflow.exception.ChatRateLimitExceededException;
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

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SuppressWarnings("null")
@WebMvcTest(controllers = ChatController.class,
        excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE,
                classes = {SecurityConfig.class, JwtAuthFilter.class}))
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class ChatControllerTest extends ControllerTestSupport {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ChatService chatService;

    @Test
    void createSession_returns201_withCreatedSession() throws Exception {
        ChatSessionRequest request = new ChatSessionRequest();
        ChatSessionResponse response = ChatSessionResponse.builder().id(1L).title("General prep chat").build();
        when(chatService.createSession(any(ChatSessionRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/chat/sessions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    void listSessions_returns200_withList() throws Exception {
        when(chatService.listSessions()).thenReturn(List.of());

        mockMvc.perform(get("/api/chat/sessions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void getMessages_returns200_withList() throws Exception {
        when(chatService.getMessages(5L)).thenReturn(List.of());

        mockMvc.perform(get("/api/chat/sessions/{id}/messages", 5L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void getMessages_returns404_whenSessionNotOwned() throws Exception {
        when(chatService.getMessages(5L)).thenThrow(new ResourceNotFoundException("Chat session not found"));

        mockMvc.perform(get("/api/chat/sessions/{id}/messages", 5L))
                .andExpect(status().isNotFound());
    }

    @Test
    void postMessage_returns200_withReply() throws Exception {
        ChatMessageRequest request = new ChatMessageRequest();
        request.setContent("Hello");

        ChatMessageResponse userMessage = ChatMessageResponse.builder().id(1L).role(ChatMessageRole.USER).content("Hello").build();
        ChatMessageResponse assistantMessage = ChatMessageResponse.builder().id(2L).role(ChatMessageRole.ASSISTANT).content("Hi there").build();
        ChatReplyResponse reply = ChatReplyResponse.builder().userMessage(userMessage).assistantMessage(assistantMessage).build();

        when(chatService.postMessage(eq(5L), any(ChatMessageRequest.class))).thenReturn(reply);

        mockMvc.perform(post("/api/chat/sessions/{id}/messages", 5L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.assistantMessage.content").value("Hi there"));
    }

    @Test
    void postMessage_returns429_onRateLimit() throws Exception {
        ChatMessageRequest request = new ChatMessageRequest();
        request.setContent("Hello");

        when(chatService.postMessage(eq(5L), any(ChatMessageRequest.class)))
                .thenThrow(new ChatRateLimitExceededException("You've reached today's message limit."));

        mockMvc.perform(post("/api/chat/sessions/{id}/messages", 5L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isTooManyRequests());
    }

    @Test
    void postMessage_returns404_whenSessionNotOwned() throws Exception {
        ChatMessageRequest request = new ChatMessageRequest();
        request.setContent("Hello");

        when(chatService.postMessage(eq(5L), any(ChatMessageRequest.class)))
                .thenThrow(new ResourceNotFoundException("Chat session not found"));

        mockMvc.perform(post("/api/chat/sessions/{id}/messages", 5L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    @Test
    void deleteSession_returns204_whenSuccessful() throws Exception {
        doNothing().when(chatService).deleteSession(anyLong());

        mockMvc.perform(delete("/api/chat/sessions/{id}", 5L))
                .andExpect(status().isNoContent());

        verify(chatService).deleteSession(5L);
    }

    @Test
    void deleteSession_returns404_whenNotOwned() throws Exception {
        doThrow(new ResourceNotFoundException("Chat session not found")).when(chatService).deleteSession(5L);

        mockMvc.perform(delete("/api/chat/sessions/{id}", 5L))
                .andExpect(status().isNotFound());
    }
}
