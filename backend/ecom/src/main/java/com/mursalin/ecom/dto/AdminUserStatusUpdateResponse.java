package com.mursalin.ecom.dto;

import com.mursalin.ecom.model.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserStatusUpdateResponse {
    private Long userId;
    private String username;
    private UserStatus status;

    public static AdminUserStatusUpdateResponse fromEntity(com.mursalin.ecom.model.User user) {
        return new AdminUserStatusUpdateResponse(
                user.getUserId(),
                user.getUsername(),
                user.getStatus()
        );
    }
}
