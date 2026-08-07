package com.careerflow.chatbot;

import com.careerflow.application.ApplicationRepository;
import com.careerflow.application.JobApplication;
import com.careerflow.chatbot.dto.*;
import com.careerflow.common.SecurityUtils;
import com.careerflow.company.Company;
import com.careerflow.exception.ChatRateLimitExceededException;
import com.careerflow.exception.ResourceNotFoundException;
import com.careerflow.interview.Interview;
import com.careerflow.interview.InterviewRepository;
import com.careerflow.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@SuppressWarnings("null")
@Service
@RequiredArgsConstructor
public class ChatService {

    private static final int MAX_FIELD_LENGTH = 1000;
    private static final int MAX_RECENT_ENTRIES = 5;

    private final ChatSessionRepository chatSessionRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ApplicationRepository applicationRepository;
    private final InterviewRepository interviewRepository;
    private final SecurityUtils securityUtils;
    private final GeminiClient geminiClient;

    @Value("${chat.rate-limit.max-messages-per-day}")
    private int maxMessagesPerDay;

    public ChatSessionResponse createSession(ChatSessionRequest request, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        JobApplication application = null;
        if (request.getJobApplicationId() != null) {
            application = applicationRepository
                    .findByIdAndUserIdAndWorkspaceId(request.getJobApplicationId(), user.getId(), workspaceId)
                    .orElseThrow(() -> new ResourceNotFoundException("Application not found"));
        }

        ChatSession session = ChatSession.builder()
                .user(user)
                .jobApplication(application)
                .title(deriveTitle(application))
                .build();

        session = chatSessionRepository.save(session);
        return toSessionResponse(session);
    }

    public List<ChatSessionResponse> listSessions() {
        User user = securityUtils.getCurrentUser();
        return chatSessionRepository.findAllByUserIdOrderByUpdatedAtDesc(user.getId())
                .stream().map(this::toSessionResponse).toList();
    }

    public List<ChatMessageResponse> getMessages(Long sessionId) {
        User user = securityUtils.getCurrentUser();
        ChatSession session = findOwnedSession(sessionId, user.getId());
        return chatMessageRepository.findAllBySessionIdOrderByCreatedAtAsc(session.getId())
                .stream().map(this::toMessageResponse).toList();
    }

    public ChatReplyResponse postMessage(Long sessionId, ChatMessageRequest request) {
        User user = securityUtils.getCurrentUser();
        ChatSession session = findOwnedSession(sessionId, user.getId());

        long recentMessageCount = chatMessageRepository.countByUserIdAndRoleAndCreatedAtAfter(
                user.getId(), ChatMessageRole.USER, LocalDateTime.now().minusHours(24));
        if (recentMessageCount >= maxMessagesPerDay) {
            throw new ChatRateLimitExceededException(
                    "You've reached today's message limit. Please try again tomorrow.");
        }

        ChatMessage userMessage = ChatMessage.builder()
                .session(session)
                .user(user)
                .role(ChatMessageRole.USER)
                .content(request.getContent())
                .build();
        userMessage = chatMessageRepository.save(userMessage);

        session.setUpdatedAt(LocalDateTime.now());
        chatSessionRepository.save(session);

        String systemPrompt = buildSystemPrompt(user, session);
        List<ChatMessage> history = chatMessageRepository.findAllBySessionIdOrderByCreatedAtAsc(session.getId());
        List<GeminiTurn> turns = history.stream()
                .map(m -> GeminiTurn.builder()
                        .role(m.getRole() == ChatMessageRole.USER ? "user" : "model")
                        .content(m.getContent())
                        .build())
                .toList();

        GeminiReply reply = geminiClient.sendMessage(systemPrompt, turns);

        ChatMessage assistantMessage = ChatMessage.builder()
                .session(session)
                .user(user)
                .role(ChatMessageRole.ASSISTANT)
                .content(reply.getText())
                .promptTokens(reply.getInputTokens())
                .completionTokens(reply.getOutputTokens())
                .build();
        assistantMessage = chatMessageRepository.save(assistantMessage);

        return ChatReplyResponse.builder()
                .userMessage(toMessageResponse(userMessage))
                .assistantMessage(toMessageResponse(assistantMessage))
                .build();
    }

    public void deleteSession(Long sessionId) {
        User user = securityUtils.getCurrentUser();
        ChatSession session = findOwnedSession(sessionId, user.getId());
        chatSessionRepository.delete(session);
    }

    private ChatSession findOwnedSession(Long sessionId, Long userId) {
        return chatSessionRepository.findByIdAndUserId(sessionId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat session not found"));
    }

    private String deriveTitle(JobApplication application) {
        if (application == null) {
            return "General prep chat";
        }
        return application.getRole() + " at " + application.getCompany().getName();
    }

    private String buildSystemPrompt(User user, ChatSession session) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("You are an interview preparation assistant for CareerFlow, a job search tracking app. ")
                .append("Help the user with mock interview Q&A and feedback, company/role-specific prep, ")
                .append("general interview questions, and reviewing resume bullets or answers they paste in. ")
                .append("Be encouraging, concrete, and concise.\n\n");

        prompt.append("## User profile\n");
        String name = user.getFirstName() + (user.getLastName() != null ? " " + user.getLastName() : "");
        prompt.append("Name: ").append(name).append("\n");
        if (user.getBio() != null && !user.getBio().isBlank()) {
            prompt.append("Bio: ").append(truncate(user.getBio())).append("\n");
        }
        appendSection(prompt, "Experience", user.getExperience(),
                e -> e.getRole() + " at " + e.getCompany());
        appendSection(prompt, "Education", user.getEducation(),
                e -> e.getDegree() + " in " + e.getFieldOfStudy() + " from " + e.getInstitution());
        appendSection(prompt, "Projects", user.getProjects(),
                p -> p.getName() + ": " + p.getDescription());

        JobApplication application = session.getJobApplication();
        if (application != null) {
            appendApplicationSection(prompt, application);
            appendCompanySection(prompt, application.getCompany());
            appendInterviewNotes(prompt, user, application);
        }

        return prompt.toString();
    }

    private void appendApplicationSection(StringBuilder prompt, JobApplication application) {
        prompt.append("\n## Target application\n");
        prompt.append("Role: ").append(application.getRole()).append("\n");
        if (application.getStatus() != null) {
            prompt.append("Status: ").append(application.getStatus()).append("\n");
        }
        if (application.getNotes() != null && !application.getNotes().isBlank()) {
            prompt.append("Notes: ").append(truncate(application.getNotes())).append("\n");
        }
    }

    private void appendCompanySection(StringBuilder prompt, Company company) {
        if (company == null) return;
        prompt.append("\n## Target company\n");
        prompt.append("Name: ").append(company.getName()).append("\n");
        if (company.getIndustry() != null) prompt.append("Industry: ").append(company.getIndustry()).append("\n");
        if (company.getLocation() != null) prompt.append("Location: ").append(company.getLocation()).append("\n");
        if (company.getDescription() != null && !company.getDescription().isBlank()) {
            prompt.append("Description: ").append(truncate(company.getDescription())).append("\n");
        }
        if (company.getNotes() != null && !company.getNotes().isBlank()) {
            prompt.append("Notes: ").append(truncate(company.getNotes())).append("\n");
        }
    }

    private void appendInterviewNotes(StringBuilder prompt, User user, JobApplication application) {
        List<Interview> interviews = interviewRepository
                .findAllByUserIdAndApplicationIdOrderByScheduledAtAsc(user.getId(), application.getId());
        if (interviews.isEmpty()) return;
        prompt.append("\n## Past interview notes for this application\n");
        for (Interview interview : interviews) {
            if (interview.getQuestionsAsked() != null && !interview.getQuestionsAsked().isBlank()) {
                prompt.append("Questions asked: ").append(truncate(interview.getQuestionsAsked())).append("\n");
            }
            if (interview.getFeedbackReceived() != null && !interview.getFeedbackReceived().isBlank()) {
                prompt.append("Feedback received: ").append(truncate(interview.getFeedbackReceived())).append("\n");
            }
        }
    }

    private <T> void appendSection(StringBuilder prompt, String header, List<T> items,
                                    java.util.function.Function<T, String> formatter) {
        if (items == null || items.isEmpty()) return;
        prompt.append(header).append(":\n");
        items.stream().limit(MAX_RECENT_ENTRIES)
                .forEach(item -> prompt.append("- ").append(formatter.apply(item)).append("\n"));
    }

    private String truncate(String text) {
        if (text.length() <= MAX_FIELD_LENGTH) return text;
        return text.substring(0, MAX_FIELD_LENGTH) + "...";
    }

    private ChatSessionResponse toSessionResponse(ChatSession session) {
        JobApplication application = session.getJobApplication();
        return ChatSessionResponse.builder()
                .id(session.getId())
                .jobApplicationId(application != null ? application.getId() : null)
                .companyName(application != null ? application.getCompany().getName() : null)
                .applicationRole(application != null ? application.getRole() : null)
                .title(session.getTitle())
                .createdAt(session.getCreatedAt())
                .updatedAt(session.getUpdatedAt())
                .messageCount((int) chatMessageRepository.countBySessionId(session.getId()))
                .build();
    }

    private ChatMessageResponse toMessageResponse(ChatMessage message) {
        return ChatMessageResponse.builder()
                .id(message.getId())
                .role(message.getRole())
                .content(message.getContent())
                .createdAt(message.getCreatedAt())
                .build();
    }
}
