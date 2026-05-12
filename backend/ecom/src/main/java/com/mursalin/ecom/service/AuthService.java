package com.mursalin.ecom.service;

import com.mursalin.ecom.dto.AuthResponse;
import com.mursalin.ecom.dto.UserLoginRequest;
import com.mursalin.ecom.dto.UserRegisterRequest;
import com.mursalin.ecom.dto.UserResponse;
import com.mursalin.ecom.exception.UserAlreadyExistsException;
import com.mursalin.ecom.model.Role;
import com.mursalin.ecom.model.User;
import com.mursalin.ecom.repository.UserRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;
    private final AuthenticationManager authenticationManager;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       UserDetailsService userDetailsService,
                       AuthenticationManager authenticationManager) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
        this.authenticationManager = authenticationManager;
    }

    public UserResponse register(UserRegisterRequest request) {
        // Validate email uniqueness
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new UserAlreadyExistsException("Email already registered");
        }

        // Validate passwords match
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new RuntimeException("Passwords do not match");
        }

        // Create and save user
        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(Role.USER); // default role

        User savedUser = userRepository.save(user);

        return new UserResponse(savedUser.getUserId(), savedUser.getEmail(), savedUser.getRole());
    }

    public AuthResponse login(UserLoginRequest request) {
        // Authenticate credentials (throws BadCredentialsException if invalid)
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        // Load user details
        UserDetails userDetails = userDetailsService.loadUserByUsername(request.getEmail());

        // Generate JWT token
        String token = jwtService.generateToken(userDetails);

        // Get user ID for response
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());
        User user = userOpt.orElseThrow(() -> new RuntimeException("User not found after authentication"));
        Long userId = user.getUserId();
        Role role = user.getRole();

        long expiresInSeconds = jwtService.getExpiration() / 1000; // expiration in ms to seconds

        return new AuthResponse(token, userId, request.getEmail(), role, expiresInSeconds);
    }
}