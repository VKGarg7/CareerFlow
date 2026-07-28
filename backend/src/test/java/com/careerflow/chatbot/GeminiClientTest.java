package com.careerflow.chatbot;

import com.careerflow.exception.LlmUnavailableException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestToUriTemplate;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

class GeminiClientTest {

    private MockRestServiceServer server;
    private GeminiClient geminiClient;

    private static final String URI_TEMPLATE =
            "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent";

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder();
        server = MockRestServiceServer.bindTo(builder).build();
        geminiClient = new GeminiClient(builder, "test-key", "gemini-2.5-flash", 1024);
    }

    @Test
    void sendMessage_parsesSuccessResponse_withTextAndUsage() {
        server.expect(requestToUriTemplate(URI_TEMPLATE, "gemini-2.5-flash"))
                .andExpect(header("x-goog-api-key", "test-key"))
                .andRespond(withSuccess("""
                        {
                          "candidates": [{
                            "content": {"parts": [{"text": "Great answer!"}], "role": "model"},
                            "finishReason": "STOP"
                          }],
                          "usageMetadata": {"promptTokenCount": 42, "candidatesTokenCount": 17}
                        }
                        """, MediaType.APPLICATION_JSON));

        GeminiReply reply = geminiClient.sendMessage("system prompt",
                List.of(GeminiTurn.builder().role("user").content("Hi").build()));

        assertThat(reply.getText()).isEqualTo("Great answer!");
        assertThat(reply.getInputTokens()).isEqualTo(42);
        assertThat(reply.getOutputTokens()).isEqualTo(17);
    }

    @Test
    void sendMessage_returnsTruncatedText_whenFinishReasonIsMaxTokens() {
        server.expect(requestToUriTemplate(URI_TEMPLATE, "gemini-2.5-flash"))
                .andExpect(header("x-goog-api-key", "test-key"))
                .andRespond(withSuccess("""
                        {
                          "candidates": [{
                            "content": {"parts": [{"text": "This got cut off..."}], "role": "model"},
                            "finishReason": "MAX_TOKENS"
                          }],
                          "usageMetadata": {"promptTokenCount": 10, "candidatesTokenCount": 1024}
                        }
                        """, MediaType.APPLICATION_JSON));

        GeminiReply reply = geminiClient.sendMessage("system prompt",
                List.of(GeminiTurn.builder().role("user").content("Hi").build()));

        assertThat(reply.getText()).isEqualTo("This got cut off...");
    }

    @Test
    void sendMessage_throwsLlmUnavailableException_on4xxResponse() {
        server.expect(requestToUriTemplate(URI_TEMPLATE, "gemini-2.5-flash"))
                .andExpect(header("x-goog-api-key", "test-key"))
                .andRespond(withStatus(org.springframework.http.HttpStatus.UNAUTHORIZED)
                        .body("{\"error\": {\"message\": \"invalid api key\"}}")
                        .contentType(MediaType.APPLICATION_JSON));

        assertThatThrownBy(() -> geminiClient.sendMessage("system prompt",
                List.of(GeminiTurn.builder().role("user").content("Hi").build())))
                .isInstanceOf(LlmUnavailableException.class);
    }

    @Test
    void sendMessage_throwsLlmUnavailableException_on5xxResponse() {
        server.expect(requestToUriTemplate(URI_TEMPLATE, "gemini-2.5-flash"))
                .andExpect(header("x-goog-api-key", "test-key"))
                .andRespond(withServerError());

        assertThatThrownBy(() -> geminiClient.sendMessage("system prompt",
                List.of(GeminiTurn.builder().role("user").content("Hi").build())))
                .isInstanceOf(LlmUnavailableException.class);
    }

    @Test
    void sendMessage_throwsLlmUnavailableException_onConnectionFailure() {
        server.expect(requestToUriTemplate(URI_TEMPLATE, "gemini-2.5-flash"))
                .andExpect(header("x-goog-api-key", "test-key"))
                .andRespond(request -> { throw new java.io.IOException("connection refused"); });

        assertThatThrownBy(() -> geminiClient.sendMessage("system prompt",
                List.of(GeminiTurn.builder().role("user").content("Hi").build())))
                .isInstanceOf(LlmUnavailableException.class);
    }
}
