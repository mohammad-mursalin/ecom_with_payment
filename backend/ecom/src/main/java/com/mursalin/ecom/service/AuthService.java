package com.mursalin.ecom.service;

import com.mursalin.ecom.dto.AuthResponse;
import com.mursalin.ecom.dto.ChangePasswordRequest;
import com.mursalin.ecom.dto.RefreshTokenRequest;
import com.mursalin.ecom.dto.UpdateProfileRequest;
import com.mursalin.ecom.dto.UserLoginRequest;
import com.mursalin.ecom.dto.UserProfileResponse;
import com.mursalin.ecom.dto.UserRegisterRequest;

public interface AuthService {
    AuthResponse register(UserRegisterRequest request);

    AuthResponse login(UserLoginRequest request);

    AuthResponse refreshToken(RefreshTokenRequest request);

    void logout(Long userId);

    UserProfileResponse getUserProfile();

    UserProfileResponse updateProfile(UpdateProfileRequest request);

    void changePassword(ChangePasswordRequest request);

    boolean isUsernameAvailable(String username);

    boolean isEmailAvailable(String email);

    void deleteAccount(Long userId, String username);
}
