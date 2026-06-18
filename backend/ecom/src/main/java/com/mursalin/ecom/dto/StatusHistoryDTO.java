package com.mursalin.ecom.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StatusHistoryDTO {
    private String status;
    private LocalDateTime changedAt;
    private String note;
    private String changedByUsername;

    public StatusHistoryDTO(String status, LocalDateTime changedAt, String note) {
        this(status, changedAt, note, null);
    }
}
