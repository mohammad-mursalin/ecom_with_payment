package com.mursalin.ecom.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderSummaryDTO {
    private Long id;
    private LocalDateTime createdAt;
    private Integer itemCount;
    private BigDecimal totalAmount;
    private String status;
    private List<OrderSummaryItemDTO> items;
}
