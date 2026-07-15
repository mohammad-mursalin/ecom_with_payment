package com.mursalin.ecom.controller;

import com.mursalin.ecom.dto.ApiResponse;
import com.mursalin.ecom.dto.chat.ChatRequest;
import com.mursalin.ecom.dto.chat.ChatResponse;
import com.mursalin.ecom.chat.orchestration.ChatOrchestrationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatOrchestrationService chatOrchestrationService;

    public ChatController(ChatOrchestrationService chatOrchestrationService) {
        this.chatOrchestrationService = chatOrchestrationService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ChatResponse>> chat(
            @Valid @RequestBody ChatRequest request
    ) {
        ChatResponse response = chatOrchestrationService.handle(request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
