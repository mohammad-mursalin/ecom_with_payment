package com.mursalin.ecom.dto;

import com.mursalin.ecom.model.Role;

public class AuthResponse {

    private String token;
    private Long userId;
    private String email;
    private Role role;
    private long expiresIn; // in seconds

    public AuthResponse() {
    }

    public AuthResponse(String token, Long userId, String email, Role role, long expiresIn) {
        this.token = token;
        this.userId = userId;
        this.email = email;
        this.role = role;
        this.expiresIn = expiresIn;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
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

    public long getExpiresIn() {
        return expiresIn;
    }

    public void setExpiresIn(long expiresIn) {
        this.expiresIn = expiresIn;
    }
}
