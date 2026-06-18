package com.mursalin.ecom.dto;

import com.mursalin.ecom.model.Role;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserProfileResponse {

    private Long userId;
    private String username;
    private String email;
    private Role role;
    private String fullName;
    private String phoneNumber;
    private String address;
    private String profilePictureUrl;
    private String bio;
}
