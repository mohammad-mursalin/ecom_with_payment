package com.mursalin.ecom.controller;

import com.mursalin.ecom.dto.ApiResponse;
import com.mursalin.ecom.dto.KbArticleResponse;
import com.mursalin.ecom.dto.KbArticleUpdateRequest;
import com.mursalin.ecom.exception.BadRequestException;
import com.mursalin.ecom.model.KbTopic;
import com.mursalin.ecom.service.KbService;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/kb")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@Validated
public class AdminKbController {

    private final KbService kbService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<KbArticleResponse>>> getAllTopics() {
        List<KbArticleResponse> topics = kbService.getAllTopics();
        return ResponseEntity.ok(ApiResponse.ok(topics));
    }

    @PutMapping("/{topic}")
    public ResponseEntity<ApiResponse<KbArticleResponse>> updateTopic(
            @PathVariable String topic,
            @Valid @RequestBody KbArticleUpdateRequest request) {
        KbTopic kbTopic;
        try {
            kbTopic = KbTopic.valueOf(topic.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid topic: " + topic);
        }
        KbArticleResponse response = kbService.updateTopic(kbTopic, request);
        return ResponseEntity.ok(ApiResponse.ok(response, "Topic updated successfully"));
    }
}
