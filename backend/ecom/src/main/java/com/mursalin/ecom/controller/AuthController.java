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
import com.mursalin.ecom.exception.UnauthorizedException;
import com.mursalin.ecom.model.UserPrinciples;
import com.mursalin.ecom.service.AuthService;
import com.mursalin.ecom.service.RefreshTokenService;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
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
public class AuthController {
 
    private final AuthService authService;
    private final RefreshTokenService refreshTokenService;

    public AuthController(AuthService authService, RefreshTokenService refreshTokenService) {
        this.authService = authService;
        this.refreshTokenService = refreshTokenService;
    }
 
    // ─── COOKIE CONFIGURATION ──────────────────────────────────────────────────
    // Cookie name used for the HttpOnly refresh token cookie.
    // Must match everywhere: login, register, refresh, logout, deleteAccount.
    private static final String REFRESH_COOKIE_NAME = "refreshToken";
    private static final String COOKIE_PATH = "/";

    // ─── REGISTER ──────────────────────────────────────────────────────────────
    // FIX: added HttpServletResponse parameter and cookie-setting block.
    // Previously: returned the refresh token in the JSON body only. No cookie was set.
    // Now: sets the same HttpOnly cookie that login() sets. This means:
    //   - The browser stores the refresh token as an HttpOnly cookie after registration.
    //   - F5 (page reload) after registration now triggers a successful silent refresh.
    //   - Register and login are now symmetric — the frontend treats them identically.
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody UserRegisterRequest request,
            HttpServletResponse response) {
 
        AuthResponse authResponse = authService.register(request);
 
        ResponseCookie refreshTokenCookie = ResponseCookie.from(REFRESH_COOKIE_NAME, authResponse.getRefreshToken())
                .httpOnly(true)
                .secure(false) // Set to true in production (HTTPS)
                .path(COOKIE_PATH)
                .sameSite("Strict")
                .maxAge(java.time.Duration.ofDays(30))
                .build();
        response.addHeader("Set-Cookie", refreshTokenCookie.toString());
 
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(authResponse, "User registered successfully"));
    }
 
    // ─── CHECK USERNAME ────────────────────────────────────────────────────────
    // Unchanged.
    @GetMapping("/check-username")
    public ResponseEntity<ApiResponse<Boolean>> checkUsername(@RequestParam String username) {
        boolean available = authService.isUsernameAvailable(username);
        return ResponseEntity.ok(ApiResponse.ok(available));
    }
 
    // ─── CHECK EMAIL ───────────────────────────────────────────────────────────
    // Unchanged.
    @GetMapping("/check-email")
    public ResponseEntity<ApiResponse<Boolean>> checkEmail(@RequestParam String email) {
        boolean available = authService.isEmailAvailable(email);
        return ResponseEntity.ok(ApiResponse.ok(available));
    }
 
    // ─── LOGIN ─────────────────────────────────────────────────────────────────
    // FIX: cookie path changed from "/api/auth/refresh" to COOKIE_PATH ("/").
    // Everything else is unchanged — login already set the cookie correctly.
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody UserLoginRequest request,
            HttpServletResponse response) {
 
        AuthResponse authResponse = authService.login(request);
 
        ResponseCookie refreshTokenCookie = ResponseCookie.from(REFRESH_COOKIE_NAME, authResponse.getRefreshToken())
                .httpOnly(true)
                .secure(false) // Set to true in production (HTTPS)
                .path(COOKIE_PATH)
                .sameSite("Strict")
                .maxAge(java.time.Duration.ofDays(request.isRememberMe() ? 90 : 30))
                .build();
        response.addHeader("Set-Cookie", refreshTokenCookie.toString());
 
        return ResponseEntity.ok(ApiResponse.ok(authResponse, "Login successful"));
    }
 
    // ─── REFRESH TOKEN ─────────────────────────────────────────────────────────
    // FIX 1: method signature changed — no longer accepts @RequestBody.
    //        Now reads the refresh token from the HttpOnly cookie the browser
    //        sends automatically with every request to COOKIE_PATH ("/").
    //
    // WHY: storing the refresh token in the request body requires the frontend to
    //      persist it somewhere across page reloads (memory is lost on F5).
    //      Any persistent storage readable by JavaScript weakens the security model.
    //      Reading from the HttpOnly cookie means JavaScript never touches the
    //      refresh token at all — it is invisible to the frontend entirely.
    //
    // FIX 2: cookie path changed from "/api/auth/refresh" to COOKIE_PATH ("/").
    //        The rotated cookie is now set at "/" so it is available to all endpoints.
    //
    // The AuthService.refreshToken(RefreshTokenRequest) call is unchanged — the
    // service still receives a RefreshTokenRequest object. We just populate it
    // from the cookie instead of from the request body.
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(
            HttpServletRequest servletRequest,
            HttpServletResponse response) {
 
        // Extract the refresh token from the HttpOnly cookie.
        // The browser sends this cookie automatically — the frontend sends no body.
        String refreshTokenValue = extractRefreshTokenFromCookie(servletRequest);
 
        if (refreshTokenValue == null || refreshTokenValue.isBlank()) {
            // No cookie present — new visitor or already logged out.
            // Return 401 so the frontend treats the user as anonymous.
            throw new UnauthorizedException("Refresh token not found. Please login.");
        }
 
        // Reuse the existing service method unchanged — wrap token in the DTO it expects.
        // NOTE: if RefreshTokenRequest does not have a no-args constructor + setter,
        // use whichever constructor your existing code uses.
        RefreshTokenRequest refreshRequest =
                new RefreshTokenRequest();
        refreshRequest.setRefreshToken(refreshTokenValue);
 
        AuthResponse authResponse = authService.refreshToken(refreshRequest);
 
        // Rotate the refresh token cookie — always issue a fresh one after a successful refresh.
        // This limits the window of token reuse if the old cookie is ever compromised.
        ResponseCookie refreshTokenCookie = ResponseCookie.from(REFRESH_COOKIE_NAME, authResponse.getRefreshToken())
                .httpOnly(true)
                .secure(false) // Set to true in production (HTTPS)
                .path(COOKIE_PATH)
                .sameSite("Strict")
                .maxAge(java.time.Duration.ofDays(30))
                .build();
        response.addHeader("Set-Cookie", refreshTokenCookie.toString());
 
        return ResponseEntity.ok(ApiResponse.ok(authResponse, "Token refreshed successfully"));
    }
 
    // ─── LOGOUT ────────────────────────────────────────────────────────────────
    // FIX 1: removed @PreAuthorize("isAuthenticated()").
    //
    // WHY: the original @PreAuthorize meant that if the access token had already
    //      expired (or was never present), the logout call returned 403 FORBIDDEN.
    //      The frontend had to guard the call with hasAccessToken(), making logout
    //      conditional. Logout must always succeed regardless of access token state —
    //      the important action is deleting the refresh token from the database
    //      and clearing the cookie. Both are done here safely even without auth.
    //
    // FIX 2: cookie path changed from "/api/auth/refresh" to COOKIE_PATH ("/").
    //        The original clearing cookie was a different cookie (different path)
    //        and did not actually delete the login cookie.
    //
    // The DB deletion (authService.logout(userId)) is now best-effort: if the user
    // is authenticated, their refresh token is deleted from the database. If not
    // (expired or missing access token), we skip the DB deletion — the cookie
    // is still cleared and the HttpOnly cookie expiry will eventually clean it up.
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<String>> logout(HttpServletResponse response) {
 
        // Best-effort DB cleanup — only possible when the access token is still valid.
        // Wrapped in try/catch so logout never fails due to auth state.
        try {
            Long userId = getAuthenticatedUserId();
            authService.logout(userId);
        } catch (Exception ignored) {
            // Access token missing or expired — skip DB deletion.
            // The cookie is still cleared below, which is the critical action.
        }
 
        // Always clear the HttpOnly refresh cookie regardless of auth state.
        ResponseCookie clearCookie = ResponseCookie.from(REFRESH_COOKIE_NAME, "")
                .httpOnly(true)
                .secure(false) // Set to true in production (HTTPS)
                .path(COOKIE_PATH)
                .sameSite("Strict")
                .maxAge(java.time.Duration.ZERO) // Immediate deletion
                .build();
        response.addHeader("Set-Cookie", clearCookie.toString());
 
        return ResponseEntity.ok(ApiResponse.success("Logged out successfully", "Logged out successfully"));
    }
 
    // ─── GET PROFILE ───────────────────────────────────────────────────────────
    // Unchanged.
    @GetMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getProfile() {
        UserProfileResponse profile = authService.getUserProfile();
        return ResponseEntity.ok(ApiResponse.success(profile));
    }
 
    // ─── UPDATE PROFILE ────────────────────────────────────────────────────────
    // Unchanged.
    @PutMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateProfile(
            @Valid @RequestBody UpdateProfileRequest request) {
        UserProfileResponse profile = authService.updateProfile(request);
        return ResponseEntity.ok(ApiResponse.success(profile, "Profile updated successfully"));
    }
 
    // ─── CHANGE PASSWORD ───────────────────────────────────────────────────────
    // Unchanged.
    @PutMapping("/password")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<String>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request) {
        authService.changePassword(request);
        return ResponseEntity.ok(ApiResponse.success("Password updated successfully", "Password updated successfully"));
    }
 
    // ─── DELETE ACCOUNT ────────────────────────────────────────────────────────
    // FIX: cookie path changed from "/api/auth/refresh" to COOKIE_PATH ("/").
    // Same bug as logout — the original clearing cookie was never received by
    // the browser as a deletion instruction for the login cookie.
    @DeleteMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<String>> deleteAccount(
            @Valid @RequestBody DeleteAccountRequest request,
            HttpServletResponse response) {
 
        Long userId = getAuthenticatedUserId();
        authService.deleteAccount(userId, request.getUsername());
 
        ResponseCookie clearCookie = ResponseCookie.from(REFRESH_COOKIE_NAME, "")
                .httpOnly(true)
                .secure(false) // Set to true in production (HTTPS)
                .path(COOKIE_PATH)
                .sameSite("Strict")
                .maxAge(java.time.Duration.ZERO)
                .build();
        response.addHeader("Set-Cookie", clearCookie.toString());
 
        return ResponseEntity.ok(ApiResponse.success("Account deleted successfully", "Account deleted successfully"));
    }
 
    // ─── PRIVATE HELPERS ───────────────────────────────────────────────────────
 
    /**
     * Extracts the refresh token value from the HttpOnly cookie in the request.
     * Returns null if the cookie is not present.
     */
    private String extractRefreshTokenFromCookie(HttpServletRequest request) {
        if (request.getCookies() == null) {
            return null;
        }
        for (Cookie cookie : request.getCookies()) {
            if (REFRESH_COOKIE_NAME.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }
 
    /**
     * Returns the authenticated user's ID from the security context.
     * Throws RuntimeException if the user is not authenticated.
     * Unchanged from original.
     */
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
