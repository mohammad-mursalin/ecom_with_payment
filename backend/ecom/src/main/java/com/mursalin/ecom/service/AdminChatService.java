package com.mursalin.ecom.service;

import com.mursalin.ecom.dto.admin.chat.AdminChatSessionDetailDTO;
import com.mursalin.ecom.dto.admin.chat.AdminChatSessionSummaryDTO;
import com.mursalin.ecom.dto.admin.chat.AdminChatStatsDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;

public interface AdminChatService {
    Page<AdminChatSessionSummaryDTO> getSessions(String search, LocalDateTime startDate, LocalDateTime endDate,
                                                  Boolean hasUser, boolean escalatedOnly, Pageable pageable);

    AdminChatSessionDetailDTO getSessionDetail(Long id);

    AdminChatStatsDTO getStats();
}
