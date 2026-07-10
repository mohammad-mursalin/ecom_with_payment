package com.mursalin.ecom.dto;

import com.mursalin.ecom.model.Role;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserRoleUpdateResponse {
    private Long userId;
    private String username;
    private Role role;

    public static AdminUserRoleUpdateResponse fromEntity(com.mursalin.ecom.model.User user) {
        return new AdminUserRoleUpdateResponse(
                user.getUserId(),
                user.getUsername(),
                user.getRole()
        );
    }
}
