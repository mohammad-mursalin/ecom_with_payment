package com.mursalin.ecom.controller;

import com.mursalin.ecom.dto.ApiResponse;
import com.mursalin.ecom.dto.AuthResponse;
import com.mursalin.ecom.dto.ChangePasswordRequest;
import com.mursalin.ecom.dto.DeleteAccountRequest;
import com.mursalin.ecom.dto.RefreshTokenRequest;
import com.mursalin.ecom.dto.UpdateProfileRequest;
import com.mursalin.ecom.dto.UserLoginRequest;
import com.mursalin.ecom.dto.UserProfileResponse;
import com.mursalin.ecom.dto.UserRegisterRequest;
import com.mursalin.ecom.dto.UserResponse;
import com.mursalin.ecom.model.User;
import com.mursalin.ecom.model.UserPrinciples;
import com.mursalin.ecom.repository.UserRepository;
import com.mursalin.ecom.service.AuthService;
import com.mursalin.ecom.service.RefreshTokenService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;
    private final RefreshTokenService refreshTokenService;

    public AuthController(AuthService authService, UserRepository userRepository, RefreshTokenService refreshTokenService) {
        this.authService = authService;
        this.userRepository = userRepository;
        this.refreshTokenService = refreshTokenService;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody UserRegisterRequest request) {
        AuthResponse authResponse = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(authResponse, "User registered successfully"));
    }

    @GetMapping("/check-username")
    public ResponseEntity<ApiResponse<Boolean>> checkUsername(@RequestParam String username) {
        boolean available = !userRepository.existsByUsername(username);
        return ResponseEntity.ok(ApiResponse.ok(available));
    }

    @GetMapping("/check-email")
    public ResponseEntity<ApiResponse<Boolean>> checkEmail(@RequestParam String email) {
        boolean available = !userRepository.existsByEmail(email);
        return ResponseEntity.ok(ApiResponse.ok(available));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody UserLoginRequest request, HttpServletResponse response) {
        AuthResponse authResponse = authService.login(request);

        ResponseCookie refreshTokenCookie = ResponseCookie.from("refreshToken", authResponse.getRefreshToken())
                .httpOnly(true)
                .secure(false)
                .path("/api/auth/refresh")
                .sameSite("Strict")
                .maxAge(java.time.Duration.ofDays(request.isRememberMe() ? 90 : 30))
                .build();
        response.addHeader("Set-Cookie", refreshTokenCookie.toString());

        return ResponseEntity.ok(ApiResponse.ok(authResponse, "Login successful"));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(@Valid @RequestBody RefreshTokenRequest request, HttpServletResponse response) {
        AuthResponse authResponse = authService.refreshToken(request);

        ResponseCookie refreshTokenCookie = ResponseCookie.from("refreshToken", authResponse.getRefreshToken())
                .httpOnly(true)
                .secure(false)
                .path("/api/auth/refresh")
                .sameSite("Strict")
                .maxAge(java.time.Duration.ofDays(30))
                .build();
        response.addHeader("Set-Cookie", refreshTokenCookie.toString());

        return ResponseEntity.ok(ApiResponse.ok(authResponse, "Token refreshed successfully"));
    }

    @PostMapping("/logout")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<String>> logout(HttpServletResponse response) {
        Long userId = getAuthenticatedUserId();
        authService.logout(userId);

        ResponseCookie refreshTokenCookie = ResponseCookie.from("refreshToken", "")
                .httpOnly(true)
                .secure(false)
                .path("/api/auth/refresh")
                .sameSite("Strict")
                .maxAge(java.time.Duration.ZERO)
                .build();
        response.addHeader("Set-Cookie", refreshTokenCookie.toString());

        return ResponseEntity.ok(ApiResponse.success("Logged out successfully", "Logged out successfully"));
    }

    @GetMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getProfile() {
        UserProfileResponse profile = authService.getUserProfile();
        return ResponseEntity.ok(ApiResponse.success(profile));
    }

    @PutMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        UserProfileResponse profile = authService.updateProfile(request);
        return ResponseEntity.ok(ApiResponse.success(profile, "Profile updated successfully"));
    }

    @PutMapping("/password")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<String>> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        authService.changePassword(request);
        return ResponseEntity.ok(ApiResponse.success("Password updated successfully", "Password updated successfully"));
    }

    @DeleteMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<String>> deleteAccount(@Valid @RequestBody DeleteAccountRequest request, HttpServletResponse response) {
        Long userId = getAuthenticatedUserId();
        authService.deleteAccount(userId, request.getUsername());

        ResponseCookie refreshTokenCookie = ResponseCookie.from("refreshToken", "")
                .httpOnly(true)
                .secure(false)
                .path("/api/auth/refresh")
                .sameSite("Strict")
                .maxAge(java.time.Duration.ZERO)
                .build();
        response.addHeader("Set-Cookie", refreshTokenCookie.toString());

        return ResponseEntity.ok(ApiResponse.success("Account deleted successfully", "Account deleted successfully"));
    }

    private Long getAuthenticatedUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("User not authenticated");
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof UserPrinciples principles) {
            return principles.getUserId();
        }
        throw new RuntimeException("Unable to determine user ID");
    }
}
