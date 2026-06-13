package com.mursalin.ecom.service;

import com.mursalin.ecom.dto.AuthResponse;
import com.mursalin.ecom.dto.ChangePasswordRequest;
import com.mursalin.ecom.dto.RefreshTokenRequest;
import com.mursalin.ecom.dto.UpdateProfileRequest;
import com.mursalin.ecom.dto.UserLoginRequest;
import com.mursalin.ecom.dto.UserProfileResponse;
import com.mursalin.ecom.dto.UserRegisterRequest;
import com.mursalin.ecom.dto.UserResponse;
import com.mursalin.ecom.exception.BadRequestException;
import com.mursalin.ecom.exception.UnauthorizedException;
import com.mursalin.ecom.exception.UserAlreadyExistsException;
import com.mursalin.ecom.model.RefreshToken;
import com.mursalin.ecom.model.Role;
import com.mursalin.ecom.model.User;
import com.mursalin.ecom.repository.RefreshTokenRepository;
import com.mursalin.ecom.repository.UserRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;
    private final AuthenticationManager authenticationManager;
    private final RefreshTokenRepository refreshTokenRepository;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       UserDetailsService userDetailsService,
                       AuthenticationManager authenticationManager,
                       RefreshTokenRepository refreshTokenRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
        this.authenticationManager = authenticationManager;
        this.refreshTokenRepository = refreshTokenRepository;
    }

    public AuthResponse register(UserRegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new UserAlreadyExistsException("Email already registered");
        }
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new UserAlreadyExistsException("Username already taken");
        }
if (!request.getPassword().equals(request.getConfirmPassword())) {
             throw new BadRequestException("Passwords do not match");
         }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(Role.USER);

        userRepository.save(user);

        UserDetailsService userDetailsServiceJpa = userDetailsService;
        String accessToken = jwtService.generateToken(userDetailsServiceJpa.loadUserByUsername(request.getEmail()));

        User savedUser = userRepository.findById(user.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        RefreshToken refreshTokenEntity = new RefreshToken();
        refreshTokenEntity.setToken(java.util.UUID.randomUUID().toString());
        refreshTokenEntity.setUser(savedUser);
        refreshTokenEntity.setExpiresAt(LocalDateTime.now().plusDays(30));
        refreshTokenRepository.save(refreshTokenEntity);

        return new AuthResponse(accessToken, refreshTokenEntity.getToken(), savedUser.getUserId(), savedUser.getUsername(), savedUser.getEmail(), savedUser.getRole());
    }

    public AuthResponse login(UserLoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        UserDetailsService userDetailsServiceJpa = userDetailsService;
        String accessToken = jwtService.generateToken(userDetailsServiceJpa.loadUserByUsername(request.getEmail()));

        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());
        User user = userOpt.orElseThrow(() -> new RuntimeException("User not found after authentication"));

        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        RefreshToken refreshTokenEntity = refreshTokenRepository.findByUser(user)
                .stream()
                .findFirst()
                .orElse(null);

        if (refreshTokenEntity == null || refreshTokenEntity.getExpiresAt().isBefore(LocalDateTime.now())) {
            if (refreshTokenEntity != null) {
                refreshTokenRepository.delete(refreshTokenEntity);
            }
            refreshTokenEntity = new RefreshToken();
            refreshTokenEntity.setToken(java.util.UUID.randomUUID().toString());
            refreshTokenEntity.setUser(user);
            int days = request.isRememberMe() ? 90 : 30;
            refreshTokenEntity.setExpiresAt(LocalDateTime.now().plusDays(days));
            refreshTokenRepository.save(refreshTokenEntity);
        }

        return new AuthResponse(accessToken, refreshTokenEntity.getToken(), user.getUserId(), user.getUsername(), user.getEmail(), user.getRole());
    }

    public AuthResponse refreshToken(RefreshTokenRequest request) {
        String tokenValue = request.getRefreshToken();
        RefreshToken refreshToken = refreshTokenRepository.findByToken(tokenValue)
                .orElseThrow(() -> new UnauthorizedException("Refresh token expired. Please login again."));

        User user = refreshToken.getUser();
        UserDetailsService userDetailsServiceJpa = userDetailsService;
        String newAccessToken = jwtService.generateToken(userDetailsServiceJpa.loadUserByUsername(user.getEmail()));

        RefreshToken newRefreshToken = new RefreshToken();
        newRefreshToken.setToken(java.util.UUID.randomUUID().toString());
        newRefreshToken.setUser(user);
        newRefreshToken.setExpiresAt(LocalDateTime.now().plusDays(30));
        refreshTokenRepository.save(newRefreshToken);

        refreshTokenRepository.delete(refreshToken);

        return new AuthResponse(newAccessToken, newRefreshToken.getToken(), user.getUserId(), user.getUsername(), user.getEmail(), user.getRole());
    }

    @Transactional
    public void logout(Long userId) {
        refreshTokenRepository.deleteByUser_UserId(userId);
    }

    public UserProfileResponse getUserProfile() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("User not authenticated");
        }

        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return new UserProfileResponse(
                user.getUserId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole(),
                user.getFullName(),
                user.getPhoneNumber(),
                user.getAddress(),
                user.getProfilePictureUrl(),
                user.getBio()
        );
    }

    public UserProfileResponse updateProfile(UpdateProfileRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("User not authenticated");
        }

        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (request.getEmail() != null && !request.getEmail().isBlank()
                && !request.getEmail().equalsIgnoreCase(user.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new UserAlreadyExistsException("Email already taken by another account");
            }
            user.setEmail(request.getEmail());
        }

        if (request.getFullName() != null) {
            user.setFullName(request.getFullName());
        }
        if (request.getPhoneNumber() != null) {
            user.setPhoneNumber(request.getPhoneNumber());
        }
        if (request.getAddress() != null) {
            user.setAddress(request.getAddress());
        }
        if (request.getBio() != null) {
            user.setBio(request.getBio());
        }
        if (request.getUsername() != null && !request.getUsername().isBlank()) {
            user.setUsername(request.getUsername());
        }

        User savedUser = userRepository.save(user);

        return new UserProfileResponse(
                savedUser.getUserId(),
                savedUser.getUsername(),
                savedUser.getEmail(),
                savedUser.getRole(),
                savedUser.getFullName(),
                savedUser.getPhoneNumber(),
                savedUser.getAddress(),
                savedUser.getProfilePictureUrl(),
                savedUser.getBio()
        );
    }

    public void changePassword(ChangePasswordRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("User not authenticated");
        }

        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new UnauthorizedException("Current password is incorrect");
        }

        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new RuntimeException("New password must be different from current password");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    public void deleteAccount(Long userId, String username) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found for deletion"));

        if (!user.getUsername().equals(username)) {
            throw new RuntimeException("Provided username does not match current account");
        }

        user.setDeletedAt(LocalDateTime.now());
        userRepository.save(user);
        refreshTokenRepository.deleteByUser_UserId(userId);
    }
}
