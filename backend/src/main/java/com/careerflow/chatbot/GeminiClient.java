package com.careerflow.chatbot;

import com.careerflow.exception.LlmUnavailableException;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.util.List;
import java.util.Map;

@Component
public class GeminiClient {

    private final RestClient restClient;
    private final String apiKey;
    private final String model;
    private final int maxTokens;

    public GeminiClient(RestClient.Builder restClientBuilder,
                         @Value("${gemini.api-key}") String apiKey,
                         @Value("${gemini.model}") String model,
                         @Value("${gemini.max-tokens:1024}") int maxTokens) {
        this.apiKey = apiKey;
        this.model = model;
        this.maxTokens = maxTokens;
        this.restClient = restClientBuilder
                .baseUrl("https://generativelanguage.googleapis.com")
                .build();
    }

    public GeminiReply sendMessage(String systemPrompt, List<GeminiTurn> history) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new LlmUnavailableException("The AI assistant is not configured. Please contact support.");
        }

        List<Map<String, Object>> contents = history.stream()
                .map(turn -> Map.<String, Object>of(
                        "role", turn.getRole(),
                        "parts", List.of(Map.of("text", turn.getContent()))))
                .toList();

        Map<String, Object> requestBody = Map.of(
                "system_instruction", Map.of("parts", List.of(Map.of("text", systemPrompt))),
                "contents", contents,
                "generationConfig", Map.of("maxOutputTokens", maxTokens)
        );

        try {
            GeminiGenerateContentResponse response = restClient.post()
                    .uri("/v1beta/models/{model}:generateContent", model)
                    .header("x-goog-api-key", apiKey)
                    .body(requestBody)
                    .retrieve()
                    .body(GeminiGenerateContentResponse.class);

            if (response == null || response.getCandidates() == null || response.getCandidates().isEmpty()) {
                throw new LlmUnavailableException("The AI assistant is currently unavailable. Please try again later.");
            }

            String text = extractText(response.getCandidates().get(0));

            if (text == null) {
                throw new LlmUnavailableException("The AI assistant is currently unavailable. Please try again later.");
            }

            Integer inputTokens = response.getUsageMetadata() != null
                    ? response.getUsageMetadata().getPromptTokenCount() : null;
            Integer outputTokens = response.getUsageMetadata() != null
                    ? response.getUsageMetadata().getCandidatesTokenCount() : null;

            return GeminiReply.builder()
                    .text(text)
                    .inputTokens(inputTokens)
                    .outputTokens(outputTokens)
                    .build();
        } catch (LlmUnavailableException ex) {
            throw ex;
        } catch (RestClientResponseException ex) {
            // Keep provider details out of the API response, but retain them in server logs.
            org.slf4j.LoggerFactory.getLogger(GeminiClient.class).warn(
                    "Gemini request failed with status {}: {}",
                    ex.getStatusCode(), ex.getResponseBodyAsString());
            throw new LlmUnavailableException(
                    "The AI assistant is currently unavailable. Please try again later.", ex);
        } catch (Exception ex) {
            org.slf4j.LoggerFactory.getLogger(GeminiClient.class).warn("Gemini request failed", ex);
            throw new LlmUnavailableException("The AI assistant is currently unavailable. Please try again later.", ex);
        }
    }

    private String extractText(Candidate candidate) {
        if (candidate.getContent() == null) return null;
        List<Part> parts = candidate.getContent().getParts();
        if (parts == null || parts.isEmpty()) return null;
        return parts.get(0).getText();
    }

    @Getter
    @Setter
    @JsonIgnoreProperties(ignoreUnknown = true)
    static class GeminiGenerateContentResponse {
        private List<Candidate> candidates;
        @JsonProperty("usageMetadata")
        private UsageMetadata usageMetadata;
    }

    @Getter
    @Setter
    @JsonIgnoreProperties(ignoreUnknown = true)
    static class Candidate {
        private Content content;
        @JsonProperty("finishReason")
        private String finishReason;
    }

    @Getter
    @Setter
    @JsonIgnoreProperties(ignoreUnknown = true)
    static class Content {
        private List<Part> parts;
        private String role;
    }

    @Getter
    @Setter
    @JsonIgnoreProperties(ignoreUnknown = true)
    static class Part {
        private String text;
    }

    @Getter
    @Setter
    @JsonIgnoreProperties(ignoreUnknown = true)
    static class UsageMetadata {
        @JsonProperty("promptTokenCount")
        private Integer promptTokenCount;
        @JsonProperty("candidatesTokenCount")
        private Integer candidatesTokenCount;
    }
}
