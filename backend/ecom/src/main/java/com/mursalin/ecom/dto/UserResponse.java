package com.mursalin.ecom.dto;

import com.mursalin.ecom.model.Role;

public class UserResponse {

    private Long userId;
    private String email;
    private Role role;

    public UserResponse() {
    }

    public UserResponse(Long userId, String email, Role role) {
        this.userId = userId;
        this.email = email;
        this.role = role;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }
}
