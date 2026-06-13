package com.mursalin.ecom.dto;

import jakarta.validation.constraints.NotBlank;

public class DeleteAccountRequest {

    @NotBlank(message = "Username is required to confirm deletion")
    private String username;

    public DeleteAccountRequest() {
    }

    public DeleteAccountRequest(String username) {
        this.username = username;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }
}
