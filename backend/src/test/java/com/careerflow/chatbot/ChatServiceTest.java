package com.careerflow.chatbot;

import com.careerflow.application.ApplicationRepository;
import com.careerflow.application.JobApplication;
import com.careerflow.chatbot.dto.ChatMessageRequest;
import com.careerflow.chatbot.dto.ChatReplyResponse;
import com.careerflow.chatbot.dto.ChatSessionRequest;
import com.careerflow.chatbot.dto.ChatSessionResponse;
import com.careerflow.common.SecurityUtils;
import com.careerflow.company.Company;
import com.careerflow.exception.ChatRateLimitExceededException;
import com.careerflow.exception.ResourceNotFoundException;
import com.careerflow.interview.Interview;
import com.careerflow.interview.InterviewRepository;
import com.careerflow.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@SuppressWarnings("null")
@ExtendWith(MockitoExtension.class)
class ChatServiceTest {

    @Mock
    private ChatSessionRepository chatSessionRepository;
    @Mock
    private ChatMessageRepository chatMessageRepository;
    @Mock
    private ApplicationRepository applicationRepository;
    @Mock
    private InterviewRepository interviewRepository;
    @Mock
    private SecurityUtils securityUtils;
    @Mock
    private GeminiClient geminiClient;

    @InjectMocks
    private ChatService chatService;

    private User currentUser;
    private JobApplication application;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(chatService, "maxMessagesPerDay", 40);

        currentUser = new User();
        currentUser.setId(1L);
        currentUser.setFirstName("Jane");

        Company company = Company.builder().user(currentUser).name("Acme").build();
        company.setId(100L);

        application = JobApplication.builder().user(currentUser).company(company).role("Backend Engineer").build();
        application.setId(50L);
    }

    @Test
    void createSession_savesSession_withOwnedApplication() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(applicationRepository.findByIdAndUserIdAndWorkspaceId(50L, 1L, 200L))
                .thenReturn(Optional.of(application));
        when(chatSessionRepository.save(any(ChatSession.class))).thenAnswer(invocation -> {
            ChatSession session = invocation.getArgument(0);
            session.setId(7L);
            return session;
        });

        ChatSessionRequest request = new ChatSessionRequest();
        request.setJobApplicationId(50L);

        ChatSessionResponse response = chatService.createSession(request, 200L);

        assertThat(response.getId()).isEqualTo(7L);
        assertThat(response.getJobApplicationId()).isEqualTo(50L);
        assertThat(response.getCompanyName()).isEqualTo("Acme");
        assertThat(response.getTitle()).isEqualTo("Backend Engineer at Acme");
    }

    @Test
    void createSession_savesSession_withoutApplication() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(chatSessionRepository.save(any(ChatSession.class))).thenAnswer(invocation -> {
            ChatSession session = invocation.getArgument(0);
            session.setId(8L);
            return session;
        });

        ChatSessionResponse response = chatService.createSession(new ChatSessionRequest(), null);

        assertThat(response.getId()).isEqualTo(8L);
        assertThat(response.getJobApplicationId()).isNull();
        assertThat(response.getTitle()).isEqualTo("General prep chat");
        verify(applicationRepository, never()).findByIdAndUserIdAndWorkspaceId(any(), any(), any());
    }

    @Test
    void createSession_throwsResourceNotFoundException_whenApplicationNotOwned() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(applicationRepository.findByIdAndUserIdAndWorkspaceId(50L, 1L, 200L))
                .thenReturn(Optional.empty());

        ChatSessionRequest request = new ChatSessionRequest();
        request.setJobApplicationId(50L);

        assertThatThrownBy(() -> chatService.createSession(request, 200L))
                .isInstanceOf(ResourceNotFoundException.class);

        verify(chatSessionRepository, never()).save(any());
    }

    @Test
    void postMessage_persistsBothMessages_andReturnsThem() {
        ChatSession session = ChatSession.builder().user(currentUser).title("General prep chat").build();
        session.setId(5L);

        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(chatSessionRepository.findByIdAndUserId(5L, 1L)).thenReturn(Optional.of(session));
        when(chatMessageRepository.countByUserIdAndRoleAndCreatedAtAfter(eq(1L), eq(ChatMessageRole.USER), any()))
                .thenReturn(0L);
        when(chatMessageRepository.save(any(ChatMessage.class))).thenAnswer(invocation -> {
            ChatMessage message = invocation.getArgument(0);
            if (message.getId() == null) {
                message.setId(message.getRole() == ChatMessageRole.USER ? 1L : 2L);
            }
            return message;
        });
        when(chatMessageRepository.findAllBySessionIdOrderByCreatedAtAsc(5L)).thenReturn(List.of());
        when(geminiClient.sendMessage(anyString(), anyList()))
                .thenReturn(GeminiReply.builder().text("Good answer!").inputTokens(10).outputTokens(20).build());

        ChatMessageRequest request = new ChatMessageRequest();
        request.setContent("Tell me about yourself");

        ChatReplyResponse response = chatService.postMessage(5L, request);

        assertThat(response.getUserMessage().getContent()).isEqualTo("Tell me about yourself");
        assertThat(response.getAssistantMessage().getContent()).isEqualTo("Good answer!");
        verify(chatMessageRepository, times(2)).save(any(ChatMessage.class));
        verify(chatSessionRepository).save(session);
    }

    @Test
    void postMessage_includesCompanyAndApplicationContext_whenSessionLinked() {
        ChatSession session = ChatSession.builder().user(currentUser).jobApplication(application)
                .title("Backend Engineer at Acme").build();
        session.setId(6L);

        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(chatSessionRepository.findByIdAndUserId(6L, 1L)).thenReturn(Optional.of(session));
        when(chatMessageRepository.countByUserIdAndRoleAndCreatedAtAfter(eq(1L), eq(ChatMessageRole.USER), any()))
                .thenReturn(0L);
        when(chatMessageRepository.save(any(ChatMessage.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(chatMessageRepository.findAllBySessionIdOrderByCreatedAtAsc(6L)).thenReturn(List.of());

        Interview interview = Interview.builder().application(application).user(currentUser)
                .scheduledAt(LocalDateTime.now())
                .questionsAsked("Tell me about a challenge")
                .feedbackReceived("Good structure, be more concise").build();
        when(interviewRepository.findAllByUserIdAndApplicationIdOrderByScheduledAtAsc(1L, 50L))
                .thenReturn(List.of(interview));

        when(geminiClient.sendMessage(anyString(), anyList()))
                .thenReturn(GeminiReply.builder().text("Sounds good").build());

        ChatMessageRequest request = new ChatMessageRequest();
        request.setContent("How should I prepare?");

        chatService.postMessage(6L, request);

        org.mockito.ArgumentCaptor<String> systemPromptCaptor = org.mockito.ArgumentCaptor.forClass(String.class);
        verify(geminiClient).sendMessage(systemPromptCaptor.capture(), anyList());
        String systemPrompt = systemPromptCaptor.getValue();

        assertThat(systemPrompt).contains("Acme");
        assertThat(systemPrompt).contains("Backend Engineer");
        assertThat(systemPrompt).contains("Tell me about a challenge");
        assertThat(systemPrompt).contains("Good structure, be more concise");
    }

    @Test
    void postMessage_omitsApplicationContext_whenSessionNotLinked() {
        ChatSession session = ChatSession.builder().user(currentUser).title("General prep chat").build();
        session.setId(5L);

        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(chatSessionRepository.findByIdAndUserId(5L, 1L)).thenReturn(Optional.of(session));
        when(chatMessageRepository.countByUserIdAndRoleAndCreatedAtAfter(eq(1L), eq(ChatMessageRole.USER), any()))
                .thenReturn(0L);
        when(chatMessageRepository.save(any(ChatMessage.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(chatMessageRepository.findAllBySessionIdOrderByCreatedAtAsc(5L)).thenReturn(List.of());
        when(geminiClient.sendMessage(anyString(), anyList()))
                .thenReturn(GeminiReply.builder().text("Sure, let's begin").build());

        ChatMessageRequest request = new ChatMessageRequest();
        request.setContent("Ask me a question");

        chatService.postMessage(5L, request);

        org.mockito.ArgumentCaptor<String> systemPromptCaptor = org.mockito.ArgumentCaptor.forClass(String.class);
        verify(geminiClient).sendMessage(systemPromptCaptor.capture(), anyList());
        assertThat(systemPromptCaptor.getValue()).doesNotContain("Target application");
        verify(interviewRepository, never()).findAllByUserIdAndApplicationIdOrderByScheduledAtAsc(any(), any());
    }

    @Test
    void postMessage_throwsRateLimitException_atThreshold() {
        ChatSession session = ChatSession.builder().user(currentUser).title("General prep chat").build();
        session.setId(5L);

        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(chatSessionRepository.findByIdAndUserId(5L, 1L)).thenReturn(Optional.of(session));
        when(chatMessageRepository.countByUserIdAndRoleAndCreatedAtAfter(eq(1L), eq(ChatMessageRole.USER), any()))
                .thenReturn(40L);

        ChatMessageRequest request = new ChatMessageRequest();
        request.setContent("One more question");

        assertThatThrownBy(() -> chatService.postMessage(5L, request))
                .isInstanceOf(ChatRateLimitExceededException.class);

        verify(chatMessageRepository, never()).save(any());
        verify(geminiClient, never()).sendMessage(anyString(), anyList());
    }

    @Test
    void postMessage_throwsResourceNotFoundException_whenSessionNotOwned() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(chatSessionRepository.findByIdAndUserId(5L, 1L)).thenReturn(Optional.empty());

        ChatMessageRequest request = new ChatMessageRequest();
        request.setContent("Hello");

        assertThatThrownBy(() -> chatService.postMessage(5L, request))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void getMessages_throwsResourceNotFoundException_whenNotOwned() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(chatSessionRepository.findByIdAndUserId(5L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> chatService.getMessages(5L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void deleteSession_removesSession_whenOwned() {
        ChatSession session = ChatSession.builder().user(currentUser).title("General prep chat").build();
        session.setId(5L);

        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(chatSessionRepository.findByIdAndUserId(5L, 1L)).thenReturn(Optional.of(session));

        chatService.deleteSession(5L);

        verify(chatSessionRepository).delete(session);
    }

    @Test
    void deleteSession_throwsResourceNotFoundException_whenNotOwned() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(chatSessionRepository.findByIdAndUserId(5L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> chatService.deleteSession(5L))
                .isInstanceOf(ResourceNotFoundException.class);

        verify(chatSessionRepository, never()).delete(any());
    }
}
