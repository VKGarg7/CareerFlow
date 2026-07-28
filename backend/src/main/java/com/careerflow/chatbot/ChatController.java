package com.careerflow.chatbot;

import com.careerflow.chatbot.dto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @PostMapping("/api/chat/sessions")
    public ResponseEntity<ChatSessionResponse> createSession(@RequestBody ChatSessionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(chatService.createSession(request));
    }

    @GetMapping("/api/chat/sessions")
    public ResponseEntity<List<ChatSessionResponse>> listSessions() {
        return ResponseEntity.ok(chatService.listSessions());
    }

    @GetMapping("/api/chat/sessions/{id}/messages")
    public ResponseEntity<List<ChatMessageResponse>> getMessages(@PathVariable Long id) {
        return ResponseEntity.ok(chatService.getMessages(id));
    }

    @PostMapping("/api/chat/sessions/{id}/messages")
    public ResponseEntity<ChatReplyResponse> postMessage(@PathVariable Long id,
                                                          @Valid @RequestBody ChatMessageRequest request) {
        return ResponseEntity.ok(chatService.postMessage(id, request));
    }

    @DeleteMapping("/api/chat/sessions/{id}")
    public ResponseEntity<Void> deleteSession(@PathVariable Long id) {
        chatService.deleteSession(id);
        return ResponseEntity.noContent().build();
    }
}
