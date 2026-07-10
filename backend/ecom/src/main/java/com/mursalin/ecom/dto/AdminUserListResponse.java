package com.mursalin.ecom.dto;

import com.mursalin.ecom.model.Role;
import com.mursalin.ecom.model.User;
import com.mursalin.ecom.model.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserListResponse {
    private Long userId;
    private String email;
    private String username;
    private Role role;
    private UserStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime lastLoginAt;

    public static AdminUserListResponse fromEntity(User user) {
        return new AdminUserListResponse(
                user.getUserId(),
                user.getEmail(),
                user.getUsername(),
                user.getRole(),
                user.getStatus(),
                user.getCreatedAt(),
                user.getLastLoginAt()
        );
    }
}
