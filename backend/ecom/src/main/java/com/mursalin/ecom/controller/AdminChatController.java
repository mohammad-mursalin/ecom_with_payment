package com.mursalin.ecom.controller;

import com.mursalin.ecom.dto.PaginatedResponse;
import com.mursalin.ecom.dto.admin.chat.AdminChatSessionDetailDTO;
import com.mursalin.ecom.dto.admin.chat.AdminChatSessionSummaryDTO;
import com.mursalin.ecom.dto.admin.chat.AdminChatStatsDTO;
import com.mursalin.ecom.service.AdminChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/admin/chat")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminChatController {

    private final AdminChatService adminChatService;

    @GetMapping("/sessions")
    public ResponseEntity<PaginatedResponse<AdminChatSessionSummaryDTO>> getSessions(
            @RequestParam(required = false, defaultValue = "") String search,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Boolean escalatedOnly,
            @RequestParam(required = false) Boolean hasUser,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "20") int pageSize
    ) {
        LocalDateTime startDateTime = startDate != null ? startDate.atStartOfDay() : null;
        LocalDateTime endDateTime = endDate != null ? endDate.plusDays(1).atStartOfDay() : null;
        Pageable pageable = org.springframework.data.domain.PageRequest.of(page, pageSize);
        Page<AdminChatSessionSummaryDTO> result = adminChatService.getSessions(search, startDateTime, endDateTime, hasUser, escalatedOnly != null && escalatedOnly, pageable);

        PaginatedResponse<AdminChatSessionSummaryDTO> response = new PaginatedResponse<>(
                result.getContent(),
                result.getNumber(),
                result.getTotalPages(),
                result.getTotalElements(),
                result.getSize(),
                result.isFirst(),
                result.isLast()
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/sessions/{id}")
    public ResponseEntity<AdminChatSessionDetailDTO> getSessionDetail(@PathVariable Long id) {
        return ResponseEntity.ok(adminChatService.getSessionDetail(id));
    }

    @GetMapping("/stats")
    public ResponseEntity<AdminChatStatsDTO> getStats() {
        return ResponseEntity.ok(adminChatService.getStats());
    }
}
