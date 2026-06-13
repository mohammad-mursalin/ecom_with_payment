package com.mursalin.ecom.dto;

import com.mursalin.ecom.model.Role;
import com.mursalin.ecom.model.UserStatus;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class AdminUserDetailResponse {
    private Long userId;
    private String email;
    private String username;
    private Role role;
    private UserStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime lastLoginAt;
    private Long orderCount;
    private BigDecimal totalSpent;
    private List<DeliveryAddressDTO> addresses;
    private List<OrderSummaryDTO> recentOrders;
}