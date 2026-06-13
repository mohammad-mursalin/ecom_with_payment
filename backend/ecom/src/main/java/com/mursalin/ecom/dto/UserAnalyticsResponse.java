package com.mursalin.ecom.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserAnalyticsResponse {
    private List<DailyCount> newPerDay;
    private long totalActive;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class DailyCount {
        private LocalDate date;
        private long count;
    }
}
